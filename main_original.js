// Configuração da API do Supabase
const SUPABASE_URL = 'https://mtrlklzbeqrksfjaoyrf.supabase.co/rest/v1/Leads';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10cmxrbHpiZXFya3NmamFveXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDEwMjQsImV4cCI6MjA2NDYxNzAyNH0.vuB9immXQgj6kRFxI24Jvky7cS1rMlg41lNUiwJlFdw';

// Elementos do DOM
const leadForm = document.getElementById('leadForm');
const submitBtn = document.getElementById('submitBtn');
const btnLoader = document.getElementById('btnLoader');
const successMessage = document.getElementById('successMessage');
const errorAlert = document.getElementById('errorAlert');
const errorText = document.getElementById('errorText');

// Campos do formulário
const nomeInput = document.getElementById('nome');
const dddInput = document.getElementById('ddd');
const telefoneInput = document.getElementById('telefone');

// Elementos de erro
const nomeError = document.getElementById('nomeError');
const dddError = document.getElementById('dddError');
const telefoneError = document.getElementById('telefoneError');

// Classe para gerenciar o estado da aplicação
class LeadCapture {
  constructor() {
    this.initializeEventListeners();
    this.setupInputMasks();
  }

  initializeEventListeners() {
    leadForm.addEventListener('submit', this.handleFormSubmit.bind(this));
    
    // Validação em tempo real
    nomeInput.addEventListener('input', () => this.validateField('nome'));
    dddInput.addEventListener('input', () => this.validateField('ddd'));
    telefoneInput.addEventListener('input', () => this.validateField('telefone'));
    
    // Limpeza de erros ao focar
    nomeInput.addEventListener('focus', () => this.clearFieldError('nome'));
    dddInput.addEventListener('focus', () => this.clearFieldError('ddd'));
    telefoneInput.addEventListener('focus', () => this.clearFieldError('telefone'));
  }

  setupInputMasks() {
    // Máscara para DDD (apenas números, máximo 2 dígitos)
    dddInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 2);
    });

    // Máscara para telefone (formato 99999-9999 ou 9999-9999)
    telefoneInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      
      if (value.length <= 8) {
        // Formato para telefone fixo: 9999-9999
        value = value.replace(/(\d{4})(\d{4})/, '$1-$2');
      } else {
        // Formato para celular: 99999-9999
        value = value.replace(/(\d{5})(\d{4})/, '$1-$2');
      }
      
      e.target.value = value;
    });
  }

  async handleFormSubmit(e) {
    e.preventDefault();
    
    if (!this.validateForm()) {
      return;
    }

    this.setLoadingState(true);
    
    try {
      const formData = this.getFormData();
      await this.submitToSupabase(formData);
      this.showSuccess();
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
      this.showError(error.message);
    } finally {
      this.setLoadingState(false);
    }
  }

  getFormData() {
    const nome = nomeInput.value.trim();
    const ddd = dddInput.value.trim();
    const telefone = telefoneInput.value.trim();
    
    return {
      nome,
      telefone: `(${ddd}) ${telefone}` // Concatena DDD + telefone
    };
  }

  async submitToSupabase(data) {
    const response = await fetch(SUPABASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_API_KEY
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  validateForm() {
    let isValid = true;
    
    if (!this.validateField('nome')) isValid = false;
    if (!this.validateField('ddd')) isValid = false;
    if (!this.validateField('telefone')) isValid = false;
    
    return isValid;
  }

  validateField(fieldName) {
    const field = document.getElementById(fieldName);
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    switch (fieldName) {
      case 'nome':
        if (!value) {
          errorMessage = 'Nome é obrigatório';
          isValid = false;
        } else if (value.length < 2) {
          errorMessage = 'Nome deve ter pelo menos 2 caracteres';
          isValid = false;
        } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value)) {
          errorMessage = 'Nome deve conter apenas letras';
          isValid = false;
        }
        break;
        
      case 'ddd':
        if (!value) {
          errorMessage = 'DDD é obrigatório';
          isValid = false;
        } else if (!/^\d{2}$/.test(value)) {
          errorMessage = 'DDD deve ter 2 dígitos';
          isValid = false;
        } else if (!this.isValidDDD(value)) {
          errorMessage = 'DDD inválido';
          isValid = false;
        }
        break;
        
      case 'telefone':
        const phoneNumber = value.replace(/\D/g, '');
        if (!value) {
          errorMessage = 'Telefone é obrigatório';
          isValid = false;
        } else if (phoneNumber.length < 8 || phoneNumber.length > 9) {
          errorMessage = 'Telefone deve ter 8 ou 9 dígitos';
          isValid = false;
        }
        break;
    }

    this.showFieldError(fieldName, errorMessage, !isValid);
    return isValid;
  }

  isValidDDD(ddd) {
    // Lista de DDDs válidos no Brasil
    const validDDDs = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19', // São Paulo
      '21', '22', '24', // Rio de Janeiro
      '27', '28', // Espírito Santo
      '31', '32', '33', '34', '35', '37', '38', // Minas Gerais
      '41', '42', '43', '44', '45', '46', // Paraná
      '47', '48', '49', // Santa Catarina
      '51', '53', '54', '55', // Rio Grande do Sul
      '61', // Distrito Federal
      '62', '64', // Goiás
      '63', // Tocantins
      '65', '66', // Mato Grosso
      '67', // Mato Grosso do Sul
      '68', // Acre
      '69', // Rondônia
      '71', '73', '74', '75', '77', // Bahia
      '79', // Sergipe
      '81', '87', // Pernambuco
      '82', // Alagoas
      '83', // Paraíba
      '84', // Rio Grande do Norte
      '85', '88', // Ceará
      '86', '89', // Piauí
      '91', '93', '94', // Pará
      '92', '97', // Amazonas
      '95', // Roraima
      '96', // Amapá
      '98', '99' // Maranhão
    ];
    
    return validDDDs.includes(ddd);
  }

  showFieldError(fieldName, message, show) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(fieldName + 'Error');
    
    if (show && message) {
      field.classList.add('error');
      field.classList.remove('success');
      errorElement.textContent = message;
      errorElement.classList.add('show');
    } else {
      field.classList.remove('error');
      if (field.value.trim()) {
        field.classList.add('success');
      }
      errorElement.classList.remove('show');
      errorElement.textContent = '';
    }
  }

  clearFieldError(fieldName) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(fieldName + 'Error');
    
    field.classList.remove('error');
    errorElement.classList.remove('show');
  }

  setLoadingState(loading) {
    if (loading) {
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
    } else {
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
    }
  }

  showSuccess() {
    successMessage.classList.add('show');
    
    // Reset form após 3 segundos
    setTimeout(() => {
      this.resetForm();
    }, 3000);
  }

  showError(message) {
    errorText.textContent = message || 'Ocorreu um erro inesperado. Tente novamente.';
    errorAlert.classList.add('show');
    
    // Esconde o erro após 5 segundos
    setTimeout(() => {
      errorAlert.classList.remove('show');
    }, 5000);
  }

  resetForm() {
    leadForm.reset();
    successMessage.classList.remove('show');
    errorAlert.classList.remove('show');
    
    // Remove classes de validação
    [nomeInput, dddInput, telefoneInput].forEach(input => {
      input.classList.remove('error', 'success');
    });
    
    // Esconde mensagens de erro
    [nomeError, dddError, telefoneError].forEach(error => {
      error.classList.remove('show');
      error.textContent = '';
    });
  }
}

// Inicializa a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  new LeadCapture();
});

// Tratamento de erros globais
window.addEventListener('error', (e) => {
  console.error('Erro não capturado:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Promise rejeitada:', e.reason);
});