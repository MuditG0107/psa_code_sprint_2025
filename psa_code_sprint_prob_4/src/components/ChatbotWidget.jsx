import React, { useState, useEffect, useRef } from 'react';

function ChatbotWidget({ employeeId }) {
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [conversationState, setConversationState] = useState('START');

    const isInitialMount = useRef(true);
    const inputRef = useRef(null);

    useEffect(() => {
        // If it's the first time the component is rendering, just update the flag and do nothing.
        if (isInitialMount.current) {
            isInitialMount.current = false;
        } else {
            // On all subsequent renders, if loading has just finished, focus the input.
            if (!isLoading) {
                inputRef.current?.focus();
            }
        }
    }, [isLoading]);


    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]); // run every time messages change

    useEffect(() => {
        const getWelcomeMessage = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/chatbot`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: "User opened chat", employee_id: employeeId, state: "START" })
                });
                if (!response.ok) throw new Error(`Network error! Status: ${response.status}`);
                const data = await response.json();
                setMessages([{ sender: 'bot', text: data.reply }]);
                setConversationState(data.next_state);
            } catch (error) {
                setMessages([{ sender: 'bot', text: 'Sorry, I couldn\'t connect to the server right now. Please try again later.' }]);
            } finally {
                setIsLoading(false);
            }
        };
        if (employeeId) {
            getWelcomeMessage();
        } else {
             setIsLoading(false);
             setMessages([{ sender: 'bot', text: 'Please provide a valid Employee ID to start.' }]);
        }
    }, [employeeId]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const newMessages = [...messages, { sender: 'user', text: userInput }];
        setMessages(newMessages);
        const currentUserInput = userInput;
        setUserInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/chatbot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: currentUserInput, employee_id: employeeId, state: conversationState })
            });
            if (!response.ok) throw new Error(`Network error! Status: ${response.status}`);
            const data = await response.json();
            setMessages([...newMessages, { sender: 'bot', text: data.reply }]);
            setConversationState(data.next_state);
        } catch (error) {
            setMessages([...newMessages, { sender: 'bot', text: 'Sorry, an error occurred while connecting.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card chatbot-container">
            <h2 className="card-title">Your AI Assistant</h2>
            <div style={{height: "80vh", overflowY: "auto", padding: "1rem", border: "1px solid #ccc", borderRadius: "8px"}} className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}>
                        {/* Handle multi-line responses from the bot */}
                        {msg.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                    </div>
                ))}
                {isLoading && <div className="message bot-message">...</div>}
                <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSendMessage} className="chat-form">
                <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your message..."
                    className="chat-input"
                    disabled={isLoading}
                />
                <button type="submit" className="chat-button" disabled={isLoading}>Send</button>
            </form>
        </div>
    );
}

export default ChatbotWidget;

