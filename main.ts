import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, ItemView, TFile, TFolder, Notice } from 'obsidian';
import { WritingDashboardView } from './WritingDashboardView';

export const WRITING_DASHBOARD_VIEW_TYPE = 'writing-dashboard-view';
export const DASHBOARD_FILENAME = '📊 Dashboard de Escrita.md';

interface WritingMetrics {
	dailyGoal: number;
	notifications: boolean;
	fixedDashboardCreated: boolean;
	wordCounts: Record<string, number>; // data -> wordCount
	streakDays: number;
	bestStreak: number;
	totalWords: number;
	focusScores: Record<string, number>; // data -> focusScore
	moodScores: Record<string, string>; // data -> mood
	projectName?: string;
	sessionTimer?: number;
	sessionActive?: boolean;
	dailyFocus?: string; // foco do dia
}

// Função utilitária debounce
function debounce(func: (...args: any[]) => void, wait: number) {
	let timeout: any;
	return (...args: any[]) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

export default class FocusWritePlugin extends Plugin {
	metrics: WritingMetrics;

	async onload() {
		console.log('Carregando plugin Focus Write');

		// Carregar métricas salvas (ou inicializar)
		await this.loadMetrics();

		// Registrar a view customizada
		this.registerView(
			WRITING_DASHBOARD_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new WritingDashboardView(leaf, this)
		);

		// Adicionar comando para abrir o dashboard
		this.addCommand({
			id: 'open-writing-dashboard',
			name: 'Abrir Dashboard de Escrita',
			callback: () => {
				this.activateView();
			}
		});

		// Adicionar comando para criar página fixa
		this.addCommand({
			id: 'create-fixed-dashboard',
			name: 'Criar Página Fixa do Dashboard',
			callback: () => {
				this.createFixedDashboardPage();
			}
		});

		// Adicionar comando para contar palavras hoje
		this.addCommand({
			id: 'count-today-words',
			name: 'Contar Palavras de Hoje',
			callback: () => {
				this.countTodayWords();
			}
		});

		// Adicionar comando para contar todas as palavras
		this.addCommand({
			id: 'count-all-words',
			name: 'Contar Todas as Palavras',
			callback: () => {
				this.countAllActiveWords();
			}
		});

		// Adicionar ribbon icon
		const ribbonIconEl = this.addRibbonIcon('lucide-asterisk', 'Dashboard de Escrita', (evt: MouseEvent) => {
			this.activateView();
		}) as unknown as HTMLElement;
		// Substituir o SVG pelo texto 'FW'
		if (ribbonIconEl) {
			ribbonIconEl.innerHTML = '';
			const span = document.createElement('span');
			span.textContent = 'FW';
			span.style.fontWeight = 'bold';
			span.style.fontSize = '18px';
			span.style.fontFamily = 'monospace';
			span.style.display = 'flex';
			span.style.alignItems = 'center';
			span.style.justifyContent = 'center';
			span.style.height = '100%';
			ribbonIconEl.appendChild(span);
		}

		// Adicionar configurações
		this.addSettingTab(new FocusWriteSettingTab(this.app, this));

		// Atualização em tempo real: escutar editor-change
		const debouncedRealtimeUpdate = debounce(async (editor: any, info: any) => {
			const file = this.app.workspace.getActiveFile?.();
			if (file) {
				await this.updateMetricsFromFile(file);
			}
		}, 400);

		this.registerEvent(
			this.app.workspace.on('editor-change', debouncedRealtimeUpdate)
		);

		// Escutar mudanças nos arquivos para atualizar métricas (salvamento)
		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (file && typeof file === 'object' && 'path' in file && !file.path.includes(DASHBOARD_FILENAME)) {
					this.updateMetricsFromFile(file as TFile);
				}
			})
		);
	}

	onunload() {
		console.log('Descarregando plugin Focus Write');
	}

	async loadMetrics(): Promise<void> {
		const savedData = await this.loadData();
		this.metrics = {
			dailyGoal: savedData?.dailyGoal ?? 500,
			notifications: savedData?.notifications ?? true,
			fixedDashboardCreated: savedData?.fixedDashboardCreated ?? false,
			wordCounts: savedData?.wordCounts ?? {},
			streakDays: savedData?.streakDays ?? 0,
			bestStreak: savedData?.bestStreak ?? 0,
			totalWords: savedData?.totalWords ?? 0,
			focusScores: savedData?.focusScores ?? {},
			moodScores: savedData?.moodScores ?? {},
			projectName: savedData?.projectName ?? 'Meu Projeto',
			sessionTimer: savedData?.sessionTimer ?? 0,
			sessionActive: savedData?.sessionActive ?? false,
			dailyFocus: savedData?.dailyFocus ?? '',
		};

		// Calcular métricas iniciais
		await this.calculateAllMetrics();
	}

	async saveMetrics(): Promise<void> {
		await this.saveData(this.metrics);
		this.emitMetricsUpdated();
	}

	async calculateAllMetrics(): Promise<void> {
		const today = new Date().toISOString().split('T')[0];
		
		// Contar palavras de hoje
		const todayWords = await this.countWordsForDate(today);
		this.metrics.wordCounts[today] = todayWords;

		// Calcular sequência
		this.calculateStreak();

		// Calcular total
		this.metrics.totalWords = Object.values(this.metrics.wordCounts).reduce((sum, count) => sum + count, 0);

		await this.saveMetrics();
	}

	async countWordsForDate(date: string): Promise<number> {
		let totalWords = 0;
		const files = this.app.vault.getMarkdownFiles();

		for (const file of files) {
			// Pular o dashboard e arquivos de sistema
			if (file.path.includes(DASHBOARD_FILENAME) || file.path.startsWith('.obsidian/')) {
				continue;
			}

			try {
				const content = await this.app.vault.read(file);
				const fileDate = this.getFileDate(file);
				
				if (fileDate === date) {
					const wordCount = this.countWords(content);
					totalWords += wordCount;
					console.log(`Arquivo ${file.path}: ${wordCount} palavras`);
				}
			} catch (error) {
				console.error(`Erro ao ler arquivo ${file.path}:`, error);
			}
		}

		console.log(`Total de palavras para ${date}: ${totalWords}`);
		return totalWords;
	}

	getFileDate(file: TFile): string {
		// Primeiro, tentar extrair data do nome do arquivo
		const fileName = file.basename;
		
		// Padrões comuns de data em nomes de arquivo
		const datePatterns = [
			/(\d{4}-\d{2}-\d{2})/, // YYYY-MM-DD
			/(\d{2}-\d{2}-\d{4})/, // MM-DD-YYYY
			/(\d{2}\/\d{2}\/\d{4})/, // MM/DD/YYYY
		];

		for (const pattern of datePatterns) {
			const match = fileName.match(pattern);
			if (match) {
				return match[1];
			}
		}

		// Se não encontrar padrão no nome, usar data de hoje (assumindo que arquivos ativos são de hoje)
		return new Date().toISOString().split('T')[0];
	}

	countWords(text: string): number {
		if (!text || text.trim().length === 0) {
			return 0;
		}

		// Remover markdown e contar palavras
		const cleanText = text
			.replace(/!\[.*?\]\(.*?\)/g, '') // Remover imagens
			.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Converter links para texto
			.replace(/[*_`~#]/g, '') // Remover formatação markdown
			.replace(/\n+/g, ' ') // Substituir quebras de linha por espaços
			.replace(/\s+/g, ' ') // Normalizar espaços
			.trim();

		if (cleanText.length === 0) {
			return 0;
		}

		const words = cleanText.split(' ').filter(word => word.length > 0);
		return words.length;
	}

	calculateStreak(): void {
		const today = new Date();
		let currentStreak = 0;
		let bestStreak = this.metrics.bestStreak;

		// Verificar sequência de dias com palavras
		for (let i = 0; i < 365; i++) {
			const checkDate = new Date(today);
			checkDate.setDate(today.getDate() - i);
			const dateStr = checkDate.toISOString().split('T')[0];
			
			const wordCount = this.metrics.wordCounts[dateStr] || 0;
			
			if (wordCount > 0) {
				currentStreak++;
			} else {
				break;
			}
		}

		this.metrics.streakDays = currentStreak;
		
		if (currentStreak > bestStreak) {
			this.metrics.bestStreak = currentStreak;
		}
	}

	async updateMetricsFromFile(file: TFile): Promise<void> {
		const today = new Date().toISOString().split('T')[0];
		const fileDate = this.getFileDate(file);
		
		if (fileDate === today) {
			// Recalcular palavras de hoje
			const todayWords = await this.countWordsForDate(today);
			this.metrics.wordCounts[today] = todayWords;
			
			// Recalcular sequência
			this.calculateStreak();
			
			// Recalcular total
			this.metrics.totalWords = Object.values(this.metrics.wordCounts).reduce((sum, count) => sum + count, 0);
			
			await this.saveMetrics();
		}
	}

	async countTodayWords(): Promise<void> {
		const today = new Date().toISOString().split('T')[0];
		const wordCount = await this.countWordsForDate(today);
		
		this.metrics.wordCounts[today] = wordCount;
		this.calculateStreak();
		this.metrics.totalWords = Object.values(this.metrics.wordCounts).reduce((sum, count) => sum + count, 0);
		
		await this.saveMetrics();
		
		new Notice(`Palavras contadas hoje: ${wordCount}`);
	}

	async countAllActiveWords(): Promise<void> {
		const today = new Date().toISOString().split('T')[0];
		let totalWords = 0;
		const files = this.app.vault.getMarkdownFiles();

		for (const file of files) {
			// Pular o dashboard e arquivos de sistema
			if (file.path.includes(DASHBOARD_FILENAME) || file.path.startsWith('.obsidian/')) {
				continue;
			}

			try {
				const content = await this.app.vault.read(file);
				const wordCount = this.countWords(content);
				totalWords += wordCount;
				console.log(`Arquivo ${file.path}: ${wordCount} palavras`);
			} catch (error) {
				console.error(`Erro ao ler arquivo ${file.path}:`, error);
			}
		}

		this.metrics.wordCounts[today] = totalWords;
		this.calculateStreak();
		this.metrics.totalWords = Object.values(this.metrics.wordCounts).reduce((sum, count) => sum + count, 0);
		
		await this.saveMetrics();
		
		new Notice(`Total de palavras em todos os arquivos: ${totalWords}`);
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(WRITING_DASHBOARD_VIEW_TYPE);

		if (leaves.length > 0) {
			// A view já existe, use a primeira
			leaf = leaves[0];
		} else {
			// Cria uma nova view na tela principal
			leaf = workspace.getLeaf();
			await leaf.setViewState({
				type: WRITING_DASHBOARD_VIEW_TYPE,
				active: true,
			});
		}

		workspace.revealLeaf(leaf);
	}

	async createFixedDashboardPage(): Promise<void> {
		try {
			// Verificar se já existe
			const existingFile = this.app.vault.getAbstractFileByPath(DASHBOARD_FILENAME);
			if (existingFile) {
				new Notice('Página do dashboard já existe!');
				return;
			}

			// Criar conteúdo do dashboard
			const dashboardContent = `# 📊 Dashboard de Escrita

## 📈 Métricas do Dia
- **Meta diária:** ${this.metrics.dailyGoal} palavras
- **Palavras escritas hoje:** ${this.metrics.wordCounts[new Date().toISOString().split('T')[0]] || 0}
- **Progresso:** ${Math.round(((this.metrics.wordCounts[new Date().toISOString().split('T')[0]] || 0) / this.metrics.dailyGoal) * 100)}%

## 📅 Sequência de Escrita
- **Dias consecutivos:** ${this.metrics.streakDays}
- **Melhor sequência:** ${this.metrics.bestStreak} dias

## 🎯 Objetivos
- [ ] Escrever ${this.metrics.dailyGoal} palavras hoje
- [ ] Manter sequência de escrita

## 📝 Notas Rápidas
- 

---
*Dashboard criado automaticamente pelo plugin Focus Write*
`;

			// Criar o arquivo
			await this.app.vault.create(DASHBOARD_FILENAME, dashboardContent);
			
			// Marcar como criado nas configurações
			this.metrics.fixedDashboardCreated = true;
			await this.saveMetrics();
			
			new Notice('Página fixa do dashboard criada com sucesso!');
			
			// Abrir o arquivo criado
			const file = this.app.vault.getAbstractFileByPath(DASHBOARD_FILENAME) as TFile;
			if (file) {
				await this.app.workspace.getLeaf().openFile(file);
			}
			
		} catch (error) {
			console.error('Erro ao criar página fixa do dashboard:', error);
			new Notice('Erro ao criar página do dashboard');
		}
	}

	getMetrics(): WritingMetrics {
		return this.metrics;
	}

	async updateFocusScore(date: string, score: number): Promise<void> {
		this.metrics.focusScores[date] = score;
		await this.saveMetrics();
	}

	async updateMoodScore(date: string, mood: string): Promise<void> {
		this.metrics.moodScores[date] = mood;
		await this.saveMetrics();
	}

	async updateDailyFocus(focus: string): Promise<void> {
		this.metrics.dailyFocus = focus;
		await this.saveMetrics();
	}

	async openDailyFocusModal(): Promise<void> {
		const modal = new DailyFocusModal(this.app, this);
		modal.open();
	}

	// Adiciona método para emitir evento customizado
	emitMetricsUpdated() {
		window.dispatchEvent(new CustomEvent('dashboard-metrics-updated'));
	}
}

class DailyFocusModal {
	plugin: FocusWritePlugin;
	private focusInput: HTMLTextAreaElement;
	private fileSuggestions: HTMLDivElement;
	private modalEl: HTMLDivElement;
	private overlayEl: HTMLDivElement;

	constructor(app: App, plugin: FocusWritePlugin) {
		this.plugin = plugin;
	}

	open() {
		this.createModal();
	}

	private createModal() {
		// Criar overlay
		this.overlayEl = document.createElement('div');
		this.overlayEl.className = 'daily-focus-modal-overlay';
		
		// Criar modal
		this.modalEl = document.createElement('div');
		this.modalEl.className = 'daily-focus-modal';
		
		// Título do modal
		this.modalEl.createEl('h2', { text: 'Definir Foco do Dia' });

		// Descrição
		this.modalEl.createEl('p', { 
			text: 'Digite o que você quer focar hoje ou selecione uma nota existente:',
			cls: 'modal-description'
		});

		// Campo de texto para digitar o foco
		const textSection = this.modalEl.createDiv('focus-text-section');
		textSection.createEl('label', { text: 'Digite seu foco:', cls: 'focus-label' });
		
		this.focusInput = textSection.createEl('textarea', {
			placeholder: 'Ex: Escrever o capítulo 3 do romance, Revisar o artigo sobre marketing...',
			cls: 'focus-textarea'
		}) as HTMLTextAreaElement;
		
		// Preencher com valor atual se existir
		if (this.plugin.metrics.dailyFocus) {
			this.focusInput.value = this.plugin.metrics.dailyFocus;
		}

		// Seção de sugestões de arquivos
		const suggestionsSection = this.modalEl.createDiv('focus-suggestions-section');
		suggestionsSection.createEl('h3', { text: 'Ou selecione uma nota:' });
		
		this.fileSuggestions = suggestionsSection.createDiv('file-suggestions');
		this.populateFileSuggestions();

		// Botões de ação
		const buttonContainer = this.modalEl.createDiv('modal-buttons');
		
		const saveButton = buttonContainer.createEl('button', {
			text: 'Salvar Foco',
			cls: 'modal-button save-button'
		});
		saveButton.addEventListener('click', async () => {
			const focus = this.focusInput.value.trim();
			if (focus) {
				await this.plugin.updateDailyFocus(focus);
				new Notice('Foco do dia definido com sucesso!');
				this.close();
			} else {
				new Notice('Por favor, digite um foco para o dia.');
			}
		});

		const cancelButton = buttonContainer.createEl('button', {
			text: 'Cancelar',
			cls: 'modal-button cancel-button'
		});
		cancelButton.addEventListener('click', () => {
			this.close();
		});

		// Adicionar ao DOM
		this.overlayEl.appendChild(this.modalEl);
		document.body.appendChild(this.overlayEl);
		
		// Adicionar estilos
		this.addModalStyles();
		
		// Focar no input
		setTimeout(() => {
			this.focusInput.focus();
		}, 100);
	}

	close() {
		if (this.overlayEl && this.overlayEl.parentNode) {
			this.overlayEl.parentNode.removeChild(this.overlayEl);
		}
	}

	private populateFileSuggestions() {
		const files = this.plugin.app.vault.getMarkdownFiles();
		const recentFiles = files
			.filter(file => !file.path.includes('📊 Dashboard de Escrita.md'))
			.slice(0, 10); // Mostrar apenas os 10 mais recentes

		if (recentFiles.length === 0) {
			this.fileSuggestions.createEl('p', { 
				text: 'Nenhuma nota encontrada.',
				cls: 'no-files-message'
			});
			return;
		}

		recentFiles.forEach(file => {
			const fileItem = this.fileSuggestions.createDiv('file-suggestion-item');
			const fileName = fileItem.createEl('span', { 
				text: file.basename,
				cls: 'file-name'
			});
			const filePath = fileItem.createEl('span', { 
				text: file.path,
				cls: 'file-path'
			});
			
			fileItem.addEventListener('click', () => {
				this.focusInput.value = `Trabalhar em: ${file.basename}`;
			});
		});
	}

	private addModalStyles() {
		const style = document.createElement('style');
		style.textContent = `
			.daily-focus-modal-overlay {
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: rgba(0, 0, 0, 0.5);
				display: flex;
				align-items: center;
				justify-content: center;
				z-index: 1000;
			}

			.daily-focus-modal {
				background: var(--background-primary);
				border-radius: 1em;
				padding: 2em;
				max-width: 600px;
				width: 90%;
				max-height: 80vh;
				overflow-y: auto;
				box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
				border: 1px solid var(--background-modifier-border);
			}

			.daily-focus-modal h2 {
				margin: 0 0 1em 0;
				color: var(--text-normal);
				font-size: 1.5em;
				font-weight: 700;
			}

			.modal-description {
				color: var(--text-muted);
				margin-bottom: 1.5em;
				font-size: 0.95em;
			}

			.focus-text-section {
				margin-bottom: 2em;
			}

			.focus-label {
				display: block;
				margin-bottom: 0.5em;
				font-weight: 600;
				color: var(--text-normal);
			}

			.focus-textarea {
				width: 100%;
				min-height: 100px;
				padding: 0.8em;
				border: 2px solid var(--background-modifier-border);
				border-radius: 0.5em;
				background: var(--background-primary);
				color: var(--text-normal);
				font-family: inherit;
				font-size: 0.95em;
				resize: vertical;
				transition: border-color 0.2s ease;
				box-sizing: border-box;
			}

			.focus-textarea:focus {
				outline: none;
				border-color: var(--interactive-accent);
			}

			.focus-suggestions-section h3 {
				margin: 0 0 1em 0;
				font-size: 1em;
				color: var(--text-normal);
			}

			.file-suggestions {
				max-height: 200px;
				overflow-y: auto;
				border: 1px solid var(--background-modifier-border);
				border-radius: 0.5em;
				background: var(--background-secondary);
			}

			.file-suggestion-item {
				padding: 0.8em;
				border-bottom: 1px solid var(--background-modifier-border);
				cursor: pointer;
				transition: background-color 0.2s ease;
				display: flex;
				flex-direction: column;
				gap: 0.2em;
			}

			.file-suggestion-item:hover {
				background: var(--background-modifier-hover);
			}

			.file-suggestion-item:last-child {
				border-bottom: none;
			}

			.file-name {
				font-weight: 600;
				color: var(--text-normal);
			}

			.file-path {
				font-size: 0.85em;
				color: var(--text-muted);
			}

			.modal-buttons {
				display: flex;
				gap: 1em;
				justify-content: flex-end;
				margin-top: 2em;
			}

			.modal-button {
				padding: 0.7em 1.5em;
				border-radius: 0.5em;
				border: none;
				font-weight: 600;
				cursor: pointer;
				transition: all 0.2s ease;
			}

			.save-button {
				background: var(--interactive-accent);
				color: var(--text-on-accent);
			}

			.save-button:hover {
				background: var(--interactive-accent-hover);
			}

			.cancel-button {
				background: var(--background-modifier-border);
				color: var(--text-normal);
			}

			.cancel-button:hover {
				background: var(--background-modifier-hover);
			}

			.no-files-message {
				padding: 1em;
				text-align: center;
				color: var(--text-muted);
				font-style: italic;
			}
		`;
		document.head.appendChild(style);
	}
}

class FocusWriteSettingTab extends PluginSettingTab {
	plugin: FocusWritePlugin;

	constructor(app: App, plugin: FocusWritePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async display(): Promise<void> {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Configurações do Focus Write' });

		// Carregar configurações
		const metrics = this.plugin.getMetrics();

		new Setting(containerEl)
			.setName('Meta Diária de Palavras')
			.setDesc('Define quantas palavras você quer escrever por dia')
			.addText(text => text
				.setPlaceholder('500')
				.setValue(metrics.dailyGoal?.toString() || '500')
				.onChange(async (value) => {
					metrics.dailyGoal = parseInt(value) || 500;
					await this.plugin.saveMetrics();
				}));

		new Setting(containerEl)
			.setName('Ativar Notificações')
			.setDesc('Receber lembretes para escrever')
			.addToggle(toggle => toggle
				.setValue(metrics.notifications || true)
				.onChange(async (value) => {
					metrics.notifications = value;
					await this.plugin.saveMetrics();
				}));

		// Separador
		containerEl.createEl('hr');

		// Seção do Dashboard Fixo
		containerEl.createEl('h3', { text: 'Dashboard Fixo' });

		new Setting(containerEl)
			.setName('Criar Página Fixa')
			.setDesc('Cria uma página do dashboard que ficará fixa no topo de todas as notas e pastas')
			.addButton(button => button
				.setButtonText(metrics.fixedDashboardCreated ? 'Recriar Página' : 'Criar Página')
				.setWarning(metrics.fixedDashboardCreated)
				.onClick(async () => {
					await this.plugin.createFixedDashboardPage();
					this.display();
				}));

		if (metrics.fixedDashboardCreated) {
			new Setting(containerEl)
				.setName('Status da Página Fixa')
				.setDesc('✅ Página do dashboard foi criada com sucesso')
				.addExtraButton(button => button
					.setIcon('refresh-cw')
					.setTooltip('Recarregar status')
					.onClick(() => this.display()));
		}

		// Seção de Estatísticas
		containerEl.createEl('h3', { text: 'Estatísticas' });

		const today = new Date().toISOString().split('T')[0];
		const todayWords = metrics.wordCounts[today] || 0;

		new Setting(containerEl)
			.setName('Palavras Hoje')
			.setDesc(`Você escreveu ${todayWords} palavras hoje`)
			.addButton(button => button
				.setButtonText('Recalcular')
				.setIcon('refresh-cw')
				.onClick(async () => {
					await this.plugin.countTodayWords();
					this.display();
				}));

		new Setting(containerEl)
			.setName('Contar Todas as Palavras')
			.setDesc('Conta palavras de todos os arquivos ativos')
			.addButton(button => button
				.setButtonText('Contar Tudo')
				.setIcon('calculator')
				.onClick(async () => {
					await this.plugin.countAllActiveWords();
					this.display();
				}));

		new Setting(containerEl)
			.setName('Total de Palavras')
			.setDesc(`Total acumulado: ${metrics.totalWords} palavras`)
			.addExtraButton(button => button
				.setIcon('info')
				.setTooltip('Total de todas as palavras contadas'));

		new Setting(containerEl)
			.setName('Sequência Atual')
			.setDesc(`${metrics.streakDays} dias consecutivos (melhor: ${metrics.bestStreak})`)
			.addExtraButton(button => button
				.setIcon('flame')
				.setTooltip('Dias consecutivos de escrita'));

		// Seção de Debug
		containerEl.createEl('hr');
		containerEl.createEl('h3', { text: 'Debug' });

		new Setting(containerEl)
			.setName('Arquivos Encontrados')
			.setDesc(`${this.plugin.app.vault.getMarkdownFiles().length} arquivos markdown no vault`)
			.addExtraButton(button => button
				.setIcon('file-text')
				.setTooltip('Total de arquivos markdown'));

		new Setting(containerEl)
			.setName('Dados Salvos')
			.setDesc(`${Object.keys(metrics.wordCounts).length} dias com dados`)
			.addExtraButton(button => button
				.setIcon('database')
				.setTooltip('Dias com contagem de palavras'));
	}
} 