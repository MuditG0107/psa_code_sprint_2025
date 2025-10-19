import React, { useState, useEffect } from 'react';

// Use an environment variable for the API URL for portability.
const API_BASE_URL = "https://psacodesprint2025.azure-api.net/openai/deployments/gpt-5-mini/chat/completions?api-version=2025-01-01-preview";

function ChatbotWidget({ employeeId, styles }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]); // Start with an empty message list
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // 1. ADD STATE to track the conversation flow.
    const [conversationState, setConversationState] = useState('START');

    // 2. ADD a useEffect to automatically get the welcome message when the bot opens.
    useEffect(() => {
        if (isOpen && messages.length === 0) { // Only run once when opened
            const getWelcomeMessage = async () => {
                setIsLoading(true);
                try {
                    const response = await fetch(`${API_BASE_URL}/api/chatbot`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: "User has opened the chat.", // A dummy message to trigger the flow
                            employee_id: employeeId,
                            state: "START"
                        })
                    });
                    const data = await response.json();
                    setMessages([{ sender: 'bot', text: data.reply }]);
                    setConversationState(data.next_state);
                } catch (error) {
                    setMessages([{ sender: 'bot', text: 'Sorry, I couldn\'t connect right now.' }]);
                } finally {
                    setIsLoading(false);
                }
            };
            getWelcomeMessage();
        }
    }, [isOpen, employeeId, messages.length]); // Dependencies for this effect

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!userInput.trim()) return;

        const newMessages = [...messages, { sender: 'user', text: userInput }];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/chatbot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userInput,
                    employee_id: employeeId,
                    state: conversationState // 3. SEND the current state to the backend
                })
            });

            if (!response.ok) {
                throw new Error(`API error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            // 4. UPDATE messages and the conversation state for the next turn
            setMessages([...newMessages, { sender: 'bot', text: data.reply }]);
            setConversationState(data.next_state);

        } catch (error) {
            setMessages([...newMessages, { sender: 'bot', text: 'Sorry, I\'m having trouble connecting. Please try again later.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return <button className="chat-opener" onClick={() => setIsOpen(true)}>Chat with Coach</button>;
    }

    return (
        <div className="chatbot-window">
            <div className="chat-header">
                <h3>Your Career Coach</h3>
                <button onClick={() => setIsOpen(false)}>X</button>
            </div>
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender}`}>
                        {msg.text}
                    </div>
                ))}
                {isLoading && <div className="message bot">...</div>}
            </div>
            <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ask about skills or roles..."
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading}>Send</button>
            </form>
        </div>
    );
}

export default ChatbotWidget;