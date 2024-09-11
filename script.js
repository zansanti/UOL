const chatRoomId = '3bd921fa-eb7a-4ba9-9339-684f70c5b996'; 
let username = '';
let selectedContact = 'todos'; // Contato selecionado para mensagens privadas
let messageType = 'message'; // Tipo de mensagem, padrão é pública

window.onload = async function() {
    await requestUsername(); // Solicita o nome do usuário
    await enterRoom(username); // Passa o nome do usuário para a função
    fetchMessages(); // Carrega as mensagens após entrar na sala
    keepUserOnline(); // Mantém o usuário online
};

// Solicita o nome do usuário e garante que o nome não seja vazio e não esteja em uso
async function requestUsername() {
    while (true) {
        username = window.prompt('Digite seu nome:');
        if (!username) {
            alert('Você precisa fornecer um nome para entrar no chat.');
            continue; // Solicita um novo nome
        }

        try {
            const response = await fetch(`https://mock-api.driven.com.br/api/v6/uol/participants/${chatRoomId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: username })
            });

            if (response.ok) {
                console.log('Usuário entrou na sala com sucesso.');
                break; // Sai do loop se o nome for aceito
            } else if (response.status === 400) {
                alert('Nome já em uso. Por favor, escolha outro nome.');
            } else {
                throw new Error('Erro ao enviar o nome para o servidor.');
            }
        } catch (error) {
            console.error('Erro ao solicitar o nome:', error);
            alert('Ocorreu um erro. Tente novamente.');
        }
    }
}

// Entra na sala do chat e notifica o servidor
async function enterRoom(username) {
    try {
        const response = await fetch(`https://mock-api.driven.com.br/api/v6/uol/participants/${chatRoomId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: username })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        console.log('Usuário entrou na sala com sucesso.');
    } catch (error) {
        console.error('Erro ao entrar na sala:', error);
    }
}

// Função para buscar mensagens do servidor
async function fetchMessages() {
    try {
        const response = await fetch(`https://mock-api.driven.com.br/api/v6/uol/messages/${chatRoomId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const messages = await response.json();
        
        // Adiciona todas as mensagens
        messages.forEach(message => {
            // Verifica se a mensagem deve ser exibida para o usuário atual
            if (message.type === 'private_message') {
                if (message.to === username || message.from === username) {
                    addMessage(message.type, message.text, message.from, message.to);
                }
            } else {
                addMessage(message.type, message.text, message.from, message.to);
            }
        });
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
    }
}

// Função para adicionar uma nova mensagem ao chat
function addMessage(type, text, from = '', to = '') {
    const chat = document.querySelector('.chat');
    const messageDiv = document.createElement('div');

    switch (type) {
        case 'status':
            messageDiv.className = 'message status';
            messageDiv.textContent = `${from} ${text}`;
            break;
        case 'private_message':
            messageDiv.className = 'message reserved';
            messageDiv.textContent = `${from} reservadamente para ${to}: ${text}`;
            break;
        case 'message':
            messageDiv.className = 'message normal';
            messageDiv.textContent = `${from} para todos: ${text}`;
            break;
        default:
            messageDiv.className = 'message';
            messageDiv.textContent = text;
            break;
    }

    chat.appendChild(messageDiv);
    chat.scrollTop = chat.scrollHeight; // Mantém o scroll no final
}

// Chama a função fetchMessages a cada 3 segundos para buscar novas mensagens
setInterval(fetchMessages, 3000); // Atualiza a cada 3 segundos

// Enviar mensagem ao clicar no ícone de envio
document.querySelector('.send ion-icon').addEventListener('click', function() {
    const input = document.querySelector('.send input');
    const messageText = input.value.trim();
    
    if (messageText) {
        // Envia a mensagem com o tipo apropriado (normal ou reservada)
        sendMessage(messageText, messageType, selectedContact);
        input.value = ''; // Limpa o campo de input
    } else {
        console.log('Campo de mensagem está vazio');
    }
});

// Função para enviar a mensagem para o servidor
async function sendMessage(text, type = 'message', to = selectedContact) {
    try {
        const messageData = {
            from: username, // Nome do usuário
            to: to, // Destinatário (todos ou um usuário específico)
            text: text, // Conteúdo da mensagem
            type: type // Tipo de mensagem (normal, privada, etc.)
        };

        const response = await fetch(`https://mock-api.driven.com.br/api/v6/uol/messages/${chatRoomId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageData)
        });

        if (!response.ok) {
            throw new Error('Erro ao enviar a mensagem');
        }

        console.log('Mensagem enviada com sucesso.');
        // Não é necessário chamar fetchMessages aqui, pois a função fetchMessages já é chamada periodicamente
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
    }
}

// Mantém o usuário online enviando status periodicamente
function keepUserOnline() {
    setInterval(async function() {
        try {
            const response = await fetch(`https://mock-api.driven.com.br/api/v6/uol/status/${chatRoomId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: username })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            } else {
                console.log('Status enviado com sucesso, usuário está online.');
            }
        } catch (error) {
            console.error('Erro ao manter o usuário online:', error);
        }
    }, 5000); // Envia o status a cada 5 segundos
}
// Mostrar o overlay quando clicar no ícone de usuários
document.querySelector('.logo ion-icon').addEventListener('click', function() {
    fetchLoggedUsers(); // Atualiza a lista de contatos
    document.getElementById('overlay').style.display = 'flex';
});

// Fechar o overlay ao clicar no botão "Fechar"
document.querySelector('.close-overlay').addEventListener('click', function() {
    document.getElementById('overlay').style.display = 'none';
});

// Confirmar contato e visibilidade
document.querySelector('.confirm-overlay').addEventListener('click', function() {
    const selectedContactRadio = document.querySelector('#contacts-list input[name="contact"]:checked');
    const selectedVisibility = document.querySelector('.visibility input[name="visibility"]:checked').value;

    // Atualiza o contato selecionado
    if (selectedContactRadio) {
        selectedContact = selectedContactRadio.value;
    } else {
        selectedContact = 'todos';
    }

    // Atualiza o tipo de mensagem com base na visibilidade
    if (selectedVisibility === 'Reservadamente') {
        messageType = 'private_message'; // Mensagem reservada
        document.getElementById('messageStatus').textContent = `Enviando para ${selectedContact} (reservadamente)`;
    } else {
        messageType = 'message'; // Mensagem pública
        document.getElementById('messageStatus').textContent = `Enviando para ${selectedContact} (público)`;
    }

    document.getElementById('overlay').style.display = 'none'; // Fecha o overlay
});

// Função para buscar e listar os usuários logados
async function fetchLoggedUsers() {
    try {
        const response = await fetch(`https://mock-api.driven.com.br/api/v6/uol/participants/${chatRoomId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const users = await response.json();
        const contactsList = document.getElementById('contacts-list');
        contactsList.innerHTML = ''; // Limpa a lista de contatos antes de adicionar

        // Filtra os usuários, removendo o próprio nome do usuário logado
        const filteredUsers = users.filter(user => user.name !== username);

        // Adiciona um item para cada usuário logado, exceto o próprio
        filteredUsers.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.className = 'contact';
            userDiv.innerHTML = `
                <input type="radio" name="contact" value="${user.name}" ${selectedContact === user.name ? 'checked' : ''}>
                <label>${user.name}</label>
            `;
            contactsList.appendChild(userDiv);
        });
    } catch (error) {
        console.error('Erro ao buscar usuários logados:', error);
    }
}