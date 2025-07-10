import { ItemView, WorkspaceLeaf } from 'obsidian';
import { WRITING_DASHBOARD_VIEW_TYPE } from './main';
import FocusWritePlugin from './main';

export class WritingDashboardView extends ItemView {
	plugin: FocusWritePlugin;
	private _metricsListener: () => void;
	private sessionTimer: number = 0;
	private sessionActive: boolean = false;
	private sessionInterval: any = null;

	constructor(leaf: WorkspaceLeaf, plugin: FocusWritePlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return WRITING_DASHBOARD_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Dashboard de Escrita';
	}

	getIcon(): string {
		return 'book-open';
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl;
		container.empty();
		// Restaurar timer salvo
		this.sessionTimer = this.plugin.metrics.sessionTimer || 0;
		this.sessionActive = this.plugin.metrics.sessionActive || false;
		if (this.sessionActive) this.startSessionTimer();
		container.createEl('h4', { text: 'Dashboard de Escrita' });
		this.renderDashboard(container);

		// Escutar evento customizado para atualizar dashboard automaticamente
		this._metricsListener = () => {
			container.empty();
			container.createEl('h4', { text: 'Dashboard de Escrita' });
			this.renderDashboard(container);
		};
		window.addEventListener('dashboard-metrics-updated', this._metricsListener);
	}

	async onClose(): Promise<void> {
		// Remover listener ao fechar
		if (this._metricsListener) {
			window.removeEventListener('dashboard-metrics-updated', this._metricsListener);
		}
	}

	renderDashboard(container: any): void {
		const dashboardContainer = container.createDiv('writing-dashboard-container');
		this.createFunctionalDashboard(dashboardContainer);
	}

	createFunctionalDashboard(container: any): void {
		const metrics = this.plugin.getMetrics();
		const today = new Date().toISOString().split('T')[0];
		const todayWords = metrics.wordCounts[today] || 0;
		const progress = Math.round((todayWords / metrics.dailyGoal) * 100);

		// Header estilo writer-dashboard
		const header = container.createDiv('dashboard-header');
		const iconDiv = header.createDiv('fw-header-icon');
		iconDiv.innerHTML = `<svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M19.5 5.5l-15 13M19.5 5.5l-5.5 13M19.5 5.5l-13 5.5" stroke="var(--interactive-accent)" stroke-width="2" stroke-linecap="round"/></svg>`;
		const titleDiv = header.createDiv('fw-header-title');
		titleDiv.createEl('h1', { text: 'Focus Write' });
		titleDiv.createEl('p', { text: `Projeto: ${this.plugin.metrics?.projectName || 'Meu Projeto'}` });
		const dateDiv = header.createDiv('fw-header-date');
		dateDiv.createEl('div', { text: 'Hoje', cls: 'fw-header-date-label' });
		dateDiv.createEl('div', { text: new Date().toLocaleDateString('pt-BR'), cls: 'fw-header-date-value' });

		// Cards principais
		const statsGrid = container.createDiv('fw-stats-grid');
		// Card 1: Meta Hoje
		const cardGoal = statsGrid.createDiv('fw-stat-card');
		const goalProgress = (this.plugin.metrics.wordCounts[new Date().toISOString().split('T')[0]] || 0) / this.plugin.metrics.dailyGoal * 100;
		cardGoal.innerHTML = `
			<div class="fw-card-header"><span class="fw-card-icon">🎯</span> <span class="fw-card-title">Meta Hoje</span> <span class="fw-card-progress">${Math.round(goalProgress)}%</span></div>
			<div class="fw-card-main"><span class="fw-card-main-big">${this.plugin.metrics.wordCounts[new Date().toISOString().split('T')[0]] || 0}</span> <span class="fw-card-main-small">de ${this.plugin.metrics.dailyGoal}</span></div>
			<div class="fw-card-bar-bg"><div class="fw-card-bar-fill" style="width:${Math.min(goalProgress,100)}%"></div></div>
		`;
		// Card 2: Sequência
		const cardStreak = statsGrid.createDiv('fw-stat-card');
		cardStreak.innerHTML = `
			<div class="fw-card-header"><span class="fw-card-icon">🔥</span> <span class="fw-card-title">Sequência</span></div>
			<div class="fw-card-main"><span class="fw-card-main-big">${this.plugin.metrics.streakDays}</span> <span class="fw-card-main-small">dias</span></div>
			<div class="fw-card-footer">Recorde: ${this.plugin.metrics.bestStreak}</div>
		`;
		// Card 3: Timer de Sessão
		const cardTimer = statsGrid.createDiv('fw-stat-card');
		cardTimer.innerHTML = `
			<div class="fw-card-header"><span class="fw-card-icon">⏱️</span> <span class="fw-card-title">Sessão Atual</span></div>
			<div class="fw-card-main"><span id="fw-session-timer" class="fw-card-main-big">${this.formatTime(this.sessionTimer)}</span></div>
			<div class="fw-card-footer">
				<button id="fw-timer-start" class="fw-timer-btn">${this.sessionActive ? 'Pausar' : 'Iniciar'}</button>
				<button id="fw-timer-reset" class="fw-timer-btn">Reset</button>
			</div>
		`;
		setTimeout(() => {
			document.getElementById('fw-timer-start')?.addEventListener('click', () => {
				if (this.sessionActive) {
					this.pauseSessionTimer();
					document.getElementById('fw-timer-start')!.textContent = 'Iniciar';
				} else {
					this.startSessionTimer();
					document.getElementById('fw-timer-start')!.textContent = 'Pausar';
				}
			});
			document.getElementById('fw-timer-reset')?.addEventListener('click', () => {
				this.resetSessionTimer();
				document.getElementById('fw-timer-start')!.textContent = 'Iniciar';
			});
		}, 0);
		// Card 4: Total de Palavras
		const cardTotal = statsGrid.createDiv('fw-stat-card');
		cardTotal.innerHTML = `
			<div class="fw-card-header"><span class="fw-card-icon">📚</span> <span class="fw-card-title">Total Geral</span></div>
			<div class="fw-card-main"><span class="fw-card-main-big">${this.plugin.metrics.totalWords.toLocaleString()}</span></div>
			<div class="fw-card-footer">Média: ${Math.round(this.plugin.metrics.totalWords / Math.max(1,Object.keys(this.plugin.metrics.wordCounts).length))}/dia</div>
		`;


		// Seção combinada: Tempo Total Focado + Ações Rápidas
		const combinedSection = container.createDiv('combined-section');
		
		// Painel de Tempo Total Focado (lado esquerdo)
		const focusTimePanel = combinedSection.createDiv('focus-time-panel');
		focusTimePanel.createEl('h3', { text: 'Tempo Total Focado' });
		const focusTimeContent = focusTimePanel.createDiv('focus-time-content');
		focusTimeContent.innerHTML = `
			<div class="focus-time-display">
				<div class="focus-time-main">${this.formatTime(this.sessionTimer)}</div>
				<div class="focus-time-label">Tempo total acumulado</div>
			</div>
		`;
		
		// Painel de Ações Rápidas (lado direito)
		const actionsPanel = combinedSection.createDiv('actions-panel');
		actionsPanel.createEl('h3', { text: 'Ações Rápidas' });
		const actionsGrid = actionsPanel.createDiv('actions-grid');

		// Botão para criar página fixa
		const createPageBtn = actionsGrid.createEl('button', {
			text: '📄 Criar Página Fixa',
			cls: 'action-button'
		});
		createPageBtn.addEventListener('click', async () => {
			await this.plugin.createFixedDashboardPage();
		});

		// Botão para contar palavras
		const countWordsBtn = actionsGrid.createEl('button', {
			text: '🔢 Contar Palavras',
			cls: 'action-button'
		});
		countWordsBtn.addEventListener('click', async () => {
			await this.plugin.countTodayWords();
			this.renderDashboard(container);
		});

		// Botão para contar todas as palavras
		const countAllWordsBtn = actionsGrid.createEl('button', {
			text: '📊 Contar Todas as Palavras',
			cls: 'action-button'
		});
		countAllWordsBtn.addEventListener('click', async () => {
			await this.plugin.countAllActiveWords();
			this.renderDashboard(container);
		});

		// Botão para definir foco do dia
		const setFocusBtn = actionsGrid.createEl('button', {
			text: '🎯 Definir Foco do Dia',
			cls: 'action-button'
		});
		setFocusBtn.addEventListener('click', async () => {
			await this.plugin.openDailyFocusModal();
		});
		


		// Seção do foco do dia
		if (this.plugin.metrics.dailyFocus) {
			const focusSection = container.createDiv('focus-section');
			focusSection.createEl('h3', { text: '🎯 Foco do Dia' });
			const focusContent = focusSection.createDiv('focus-content');
			
			const focusText = focusContent.createDiv('focus-text');
			focusText.textContent = this.plugin.metrics.dailyFocus;
			
			const editBtn = focusContent.createEl('button', {
				text: 'Editar',
				cls: 'focus-edit-btn'
			});
			editBtn.addEventListener('click', async () => {
				await this.plugin.openDailyFocusModal();
			});
		}

		// Seção de histórico recente
		const historySection = container.createDiv('history-section');
		historySection.createEl('h3', { text: 'Histórico Recente' });

		const historyList = historySection.createDiv('history-list');
		const recentDates = Object.keys(metrics.wordCounts)
			.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
			.slice(0, 7);

		if (recentDates.length === 0) {
			historyList.createEl('p', { 
				text: 'Nenhum dado de escrita encontrado ainda. Comece a escrever!',
				cls: 'no-data'
			});
		} else {
			recentDates.forEach(date => {
				const wordCount = metrics.wordCounts[date];
				const dateObj = new Date(date);
				const formattedDate = dateObj.toLocaleDateString('pt-BR');
				
				const historyItem = historyList.createDiv('history-item');
				historyItem.createEl('span', { 
					text: formattedDate,
					cls: 'history-date'
				});
				historyItem.createEl('span', { 
					text: `${wordCount} palavras`,
					cls: 'history-words'
				});
			});
		}

		this.addDashboardStyles(container);
	}

	addDashboardStyles(container: any): void {
		const style = container.createEl('style');
		style.textContent = `
			.writing-dashboard-container {
				padding: 2vw 1vw;
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
				background: linear-gradient(135deg, var(--background-primary) 0%, var(--background-secondary) 100%);
				min-height: 100vh;
				box-sizing: border-box;
				max-width: 100vw;
				height: 100%;
				overflow-y: auto;
			}
			
			.dashboard-header {
				margin-bottom: 2.5vw;
				display: flex;
				flex-direction: row;
				align-items: center;
				gap: 1.2em;
				padding: 2vw 1vw;
				background: linear-gradient(135deg, var(--background-secondary) 0%, var(--background-modifier-border) 100%);
				border-radius: 1.2em;
				box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
				border: 1px solid var(--background-modifier-border);
				width: 100%;
				box-sizing: border-box;
				justify-content: flex-start;
			}
			
			.dashboard-header .fw-logo {
				font-size: 2.8em;
				font-weight: 900;
				letter-spacing: 0.1em;
				background: linear-gradient(135deg, var(--interactive-accent) 0%, var(--interactive-accent-hover) 100%);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
				background-clip: text;
				margin: 0;
				line-height: 1.1;
			}
			.dashboard-header .fw-title {
				font-size: 1.3em;
				font-weight: 600;
				color: var(--text-normal);
				margin-left: 0.2em;
				opacity: 0.8;
			}
			
			.dashboard-header p {
				display: none;
			}

			.refresh-button {
				align-self: flex-end;
				background: linear-gradient(135deg, var(--interactive-accent) 0%, var(--interactive-accent-hover) 100%);
				color: var(--text-on-accent);
				border: none;
				padding: 0.7em 1.2em;
				border-radius: 0.7em;
				cursor: pointer;
				font-size: 1em;
				font-weight: 600;
				box-shadow: 0 4px 15px rgba(var(--interactive-accent-rgb), 0.15);
				transition: all 0.3s ease;
				margin-top: 0.5vw;
				margin-left: auto;
			}

			.refresh-button:hover {
				transform: translateY(-2px);
				box-shadow: 0 6px 20px rgba(var(--interactive-accent-rgb), 0.18);
			}
			
			.stats-grid {
				display: grid;
				grid-template-columns: 1fr;
				gap: 1.2em;
				margin-bottom: 2vw;
			}
			
			.stat-card {
				background: linear-gradient(135deg, var(--background-secondary) 0%, var(--background-primary) 100%);
				padding: 1.2em 1em;
				border-radius: 1em;
				border: 1px solid var(--background-modifier-border);
				box-shadow: 0 4px 18px rgba(0, 0, 0, 0.07);
				transition: all 0.3s ease;
				position: relative;
				overflow: hidden;
				min-width: 0;
			}

			.stat-card::before {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				height: 4px;
				background: linear-gradient(90deg, var(--interactive-accent) 0%, var(--interactive-accent-hover) 100%);
			}

			.stat-card:hover {
				transform: translateY(-3px) scale(1.01);
				box-shadow: 0 8px 25px rgba(0, 0, 0, 0.13);
			}
			
			.stat-card h3 {
				margin: 0 0 0.7em 0;
				font-size: 0.95em;
				color: var(--text-muted);
				text-transform: uppercase;
				letter-spacing: 1px;
				font-weight: 600;
			}
			
			.stat-number {
				font-size: 2em;
				font-weight: 800;
				color: var(--text-normal);
				margin-bottom: 0.3em;
				text-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
				word-break: break-all;
			}
			
			.stat-meta {
				margin: 0;
				font-size: 0.95em;
				color: var(--text-muted);
				font-weight: 500;
			}

			.progress-bar {
				width: 100%;
				height: 0.7em;
				background: var(--background-modifier-border);
				border-radius: 0.4em;
				margin: 0.7em 0 0.2em 0;
				overflow: hidden;
				box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.07);
			}

			.progress-fill {
				height: 100%;
				background: linear-gradient(90deg, var(--interactive-accent) 0%, var(--interactive-accent-hover) 100%);
				transition: width 0.5s ease;
				border-radius: 0.4em;
				box-shadow: 0 2px 4px rgba(var(--interactive-accent-rgb), 0.13);
			}

			.progress-text {
				font-size: 0.95em;
				color: var(--text-muted);
				margin: 0.2em 0 0 0;
				font-weight: 600;
			}

			.combined-section {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 1.5em;
				margin-bottom: 2vw;
			}
			
			@media (max-width: 768px) {
				.combined-section {
					grid-template-columns: 1fr;
				}
			}
			
			.focus-time-panel, .actions-panel {
				padding: 1.2em 1em;
				background: linear-gradient(135deg, var(--background-secondary) 0%, var(--background-modifier-border) 100%);
				border-radius: 1em;
				box-shadow: 0 4px 18px rgba(0, 0, 0, 0.07);
				border: 1px solid var(--background-modifier-border);
			}
			
			.focus-time-panel h3, .actions-panel h3 {
				margin: 0 0 1em 0;
				color: var(--text-normal);
				font-size: 1.1em;
				font-weight: 700;
			}
			
			.focus-time-content {
				display: flex;
				flex-direction: column;
				gap: 1em;
			}
			
			.focus-time-display {
				text-align: center;
			}
			
			.focus-time-main {
				font-size: 2.5em;
				font-weight: 800;
				color: var(--text-normal);
				margin-bottom: 0.3em;
			}
			
			.focus-time-label {
				font-size: 0.9em;
				color: var(--text-muted);
				font-weight: 500;
			}
			


			.actions-section {
				margin-bottom: 2vw;
				padding: 1.2em 1em;
				background: linear-gradient(135deg, var(--background-secondary) 0%, var(--background-modifier-border) 100%);
				border-radius: 1em;
				box-shadow: 0 4px 18px rgba(0, 0, 0, 0.07);
				border: 1px solid var(--background-modifier-border);
			}

			.actions-section h3 {
				margin: 0 0 1em 0;
				color: var(--text-normal);
				font-size: 1.1em;
				font-weight: 700;
			}

			.actions-grid {
				display: flex;
				flex-direction: column;
				gap: 0.7em;
			}

			.action-button {
				background: linear-gradient(135deg, var(--background-primary) 0%, var(--background-secondary) 100%);
				color: var(--text-normal);
				border: 2px solid var(--background-modifier-border);
				padding: 0.9em 1.2em;
				border-radius: 0.8em;
				cursor: pointer;
				font-size: 1em;
				font-weight: 600;
				transition: all 0.3s ease;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
				width: 100%;
			}

			.action-button:hover {
				background: linear-gradient(135deg, var(--interactive-accent) 0%, var(--interactive-accent-hover) 100%);
				color: var(--text-on-accent);
				border-color: var(--interactive-accent);
				transform: translateY(-2px);
				box-shadow: 0 4px 18px rgba(var(--interactive-accent-rgb), 0.13);
			}

			.history-section {
				margin-bottom: 2vw;
				padding: 1.2em 1em;
				background: linear-gradient(135deg, var(--background-secondary) 0%, var(--background-modifier-border) 100%);
				border-radius: 1em;
				box-shadow: 0 4px 18px rgba(0, 0, 0, 0.07);
				border: 1px solid var(--background-modifier-border);
			}

			.history-section h3 {
				margin: 0 0 1em 0;
				color: var(--text-normal);
				font-size: 1.1em;
				font-weight: 700;
			}

			.history-list {
				background: linear-gradient(135deg, var(--background-primary) 0%, var(--background-secondary) 100%);
				border-radius: 0.8em;
				padding: 1em;
				border: 1px solid var(--background-modifier-border);
				box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
			}

			.history-item {
				display: flex;
				justify-content: space-between;
				padding: 0.7em 0;
				border-bottom: 1px solid var(--background-modifier-border);
				transition: all 0.2s ease;
			}

			.history-item:hover {
				background: var(--background-modifier-hover);
				margin: 0 -1em;
				padding: 0.7em 1em;
				border-radius: 0.5em;
			}

			.history-item:last-child {
				border-bottom: none;
			}

			.history-date {
				color: var(--text-normal);
				font-weight: 600;
				font-size: 1em;
			}

			.history-words {
				color: var(--text-muted);
				font-weight: 500;
				font-size: 0.95em;
			}

			.no-data {
				text-align: center;
				color: var(--text-muted);
				font-style: italic;
				margin: 1.5vw 0;
				font-size: 1em;
				padding: 1em;
				background: var(--background-modifier-hover);
				border-radius: 0.7em;
				border: 2px dashed var(--background-modifier-border);
			}

			.focus-section {
				margin-bottom: 2vw;
				padding: 1.2em 1em;
				background: linear-gradient(135deg, var(--background-secondary) 0%, var(--background-modifier-border) 100%);
				border-radius: 1em;
				box-shadow: 0 4px 18px rgba(0, 0, 0, 0.07);
				border: 1px solid var(--background-modifier-border);
			}

			.focus-section h3 {
				margin: 0 0 1em 0;
				color: var(--text-normal);
				font-size: 1.1em;
				font-weight: 700;
			}

			.focus-content {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 1em;
			}

			.focus-text {
				flex: 1;
				padding: 0.8em;
				background: var(--background-primary);
				border-radius: 0.5em;
				border: 1px solid var(--background-modifier-border);
				color: var(--text-normal);
				font-size: 0.95em;
				line-height: 1.4;
			}

			.focus-edit-btn {
				padding: 0.5em 1em;
				border-radius: 0.5em;
				border: none;
				background: var(--interactive-accent);
				color: var(--text-on-accent);
				font-weight: 600;
				cursor: pointer;
				transition: all 0.2s ease;
				font-size: 0.9em;
			}

			.focus-edit-btn:hover {
				background: var(--interactive-accent-hover);
				transform: translateY(-1px);
			}

			/* Header estilo writer-dashboard */
			.fw-header-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: var(--interactive-accent); border-radius: 12px; margin-right: 1em; }
			.fw-header-title { display: flex; flex-direction: column; justify-content: center; }
			.fw-header-title h1 { margin: 0; font-size: 1.7em; font-weight: 700; color: var(--text-normal); }
			.fw-header-title p { margin: 0; font-size: 1em; color: var(--text-muted); }
			.fw-header-date { margin-left: auto; text-align: right; }
			.fw-header-date-label { font-size: 0.9em; color: var(--text-muted); }
			.fw-header-date-value { font-size: 1.2em; font-weight: 600; color: var(--text-normal); }

			.fw-stats-grid { display: grid; grid-template-columns: 1fr; gap: 1.2em; margin-bottom: 2vw; }
			@media (min-width: 600px) { .fw-stats-grid { grid-template-columns: repeat(2, 1fr); } }
			@media (min-width: 900px) { .fw-stats-grid { grid-template-columns: repeat(4, 1fr); } }
			.fw-stat-card { background: var(--background-secondary); border-radius: 1em; box-shadow: 0 4px 18px rgba(0,0,0,0.07); border: 1px solid var(--background-modifier-border); padding: 1.2em 1em; display: flex; flex-direction: column; min-width: 0; }
			.fw-card-header { display: flex; align-items: center; gap: 0.5em; font-size: 1em; font-weight: 600; margin-bottom: 0.5em; }
			.fw-card-icon { font-size: 1.2em; }
			.fw-card-title { color: var(--text-normal); }
			.fw-card-progress { margin-left: auto; color: var(--interactive-accent); font-size: 0.95em; font-weight: 700; }
			.fw-card-main { display: flex; align-items: baseline; gap: 0.3em; margin-bottom: 0.5em; }
			.fw-card-main-big { font-size: 2em; font-weight: 800; color: var(--text-normal); }
			.fw-card-main-small { font-size: 1em; color: var(--text-muted); }
			.fw-card-bar-bg { width: 100%; height: 0.7em; background: var(--background-modifier-border); border-radius: 0.4em; overflow: hidden; }
			.fw-card-bar-fill { height: 100%; background: linear-gradient(90deg, var(--interactive-accent) 0%, var(--interactive-accent-hover) 100%); border-radius: 0.4em; transition: width 0.5s; }
			.fw-card-footer { font-size: 0.95em; color: var(--text-muted); font-weight: 500; margin-top: 0.2em; }
			.fw-timer-btn { margin-right: 0.5em; padding: 0.3em 0.8em; border-radius: 0.5em; border: none; background: var(--background-modifier-border); color: var(--text-normal); font-weight: 600; cursor: pointer; transition: background 0.2s; }
			.fw-timer-btn:hover { background: var(--interactive-accent); color: var(--text-on-accent); }
		`;
	}

	// Função para formatar tempo
	private formatTime(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	// Métodos para timer
	private startSessionTimer() {
		if (!this.sessionActive) {
			this.sessionActive = true;
			this.sessionInterval = setInterval(() => {
				this.sessionTimer++;
				this.updateSessionTimerUI();
			}, 1000);
		}
	}
	private pauseSessionTimer() {
		if (this.sessionActive) {
			this.sessionActive = false;
			clearInterval(this.sessionInterval);
		}
	}
	private resetSessionTimer() {
		this.pauseSessionTimer();
		this.sessionTimer = 0;
		this.sessionActive = false;
		this.updateSessionTimerUI();
	}
	private updateSessionTimerUI() {
		const timerEl = document.getElementById('fw-session-timer');
		const focusTimerEl = document.querySelector('.focus-time-main');
		if (timerEl) timerEl.textContent = this.formatTime(this.sessionTimer);
		if (focusTimerEl) focusTimerEl.textContent = this.formatTime(this.sessionTimer);
		// Salvar no plugin
		this.plugin.metrics.sessionTimer = this.sessionTimer;
		this.plugin.metrics.sessionActive = this.sessionActive;
		this.plugin.saveMetrics();
	}
} 