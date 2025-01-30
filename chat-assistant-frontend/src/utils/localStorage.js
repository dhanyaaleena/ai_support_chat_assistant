export const getTickets = () => {
  if (typeof window !== "undefined") {
    const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    return tickets;
  }
  return []; // Return an empty array if running on the server
};

export const createTicket = (ticket) => {
  if (typeof window !== "undefined") {
    const tickets = getTickets();
    tickets.push(ticket);
    localStorage.setItem('tickets', JSON.stringify(tickets));
  }
};

export const updateTicketStatus = (ticketId, newStatus) => {
  const tickets = getTickets();
  const updatedTickets = tickets.map(ticket =>
    ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
  );
  localStorage.setItem('tickets', JSON.stringify(updatedTickets));
};

export const assignTicketToEngineer = (ticketId, assignedToEngineer) => {
  const tickets = getTickets();
  const updatedTickets = tickets.map(ticket =>
    ticket.id === ticketId ? { ...ticket, assignedToEngineer } : ticket
  );
  localStorage.setItem('tickets', JSON.stringify(updatedTickets));
};

export const unassignTicket = (ticketId) => {
  const tickets = getTickets();
  const updatedTickets = tickets.map(ticket =>
    ticket.id === ticketId ? { ...ticket, assignedToEngineer: false } : ticket
  );
  localStorage.setItem('tickets', JSON.stringify(updatedTickets));
};
