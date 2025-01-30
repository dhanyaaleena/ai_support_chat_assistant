export default function handler(req, res) {
    const { query } = req.body;
  
    // Mock FAQ retrieval and AI response
    const response = `AI: I understand your query about "${query}". How can I assist you further?`;
  
    // Mock ticket creation logic
    if (query.toLowerCase().includes('create ticket')) {
      res.status(200).json({ response: 'AI: A ticket has been created. Ticket ID: 12345' });
    } else {
      res.status(200).json({ response });
    }
  }