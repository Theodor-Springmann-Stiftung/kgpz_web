/**
 * ErrorModal Web Component
 * A reusable error modal component without shadow DOM for Tailwind compatibility
 */
class ErrorModal extends HTMLElement {
    constructor() {
        super();
        // No shadow DOM - use regular DOM for Tailwind styling
        this.innerHTML = `
            <div id="error-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center backdrop-blur-sm">
                <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-red-600 flex items-center gap-2">
                                <i class="ri-error-warning-line text-xl"></i>
                                Fehler
                            </h3>
                            <button class="close-btn text-gray-400 hover:text-gray-600 transition-colors">
                                <i class="ri-close-line text-xl"></i>
                            </button>
                        </div>
                        <div class="error-content text-slate-700">
                            <!-- Error content will be loaded here -->
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button class="close-btn px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors">
                                Schließen
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.modal = this.querySelector('#error-modal');
        this.errorContent = this.querySelector('.error-content');
        this.closeButtons = this.querySelectorAll('.close-btn');

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close button clicks
        this.closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.close());
        });

        // Close on ESC key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.close();
            }
        });

        // Close when clicking outside modal
        this.modal.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.close();
            }
        });
    }

    show(content) {
        this.errorContent.innerHTML = content;
        this.modal.classList.remove('hidden');
    }

    close() {
        this.modal.classList.add('hidden');
    }

    // Global helper functions for backward compatibility
    connectedCallback() {
        // Make functions globally available
        window.showErrorModal = (content) => this.show(content);
        window.closeErrorModal = () => this.close();
    }
}

// Define the custom element
customElements.define('error-modal', ErrorModal);

export { ErrorModal };