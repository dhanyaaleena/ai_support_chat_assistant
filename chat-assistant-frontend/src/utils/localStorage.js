const SAMPLE_TICKETS = [
  {
    id: "TCKT-001",
    summary: "Payment failure on checkout",
    issueType: "Payment",
    additionalNotes: "Customer unable to complete the payment via Razorpay.",
    status: "Open",
    assignedToEngineer: false,
  },
  {
    id: "TCKT-002",
    summary: "Profile update issue",
    issueType: "Account",
    additionalNotes: "User unable to update their phone number.",
    status: "In Progress",
    assignedToEngineer: true,
  },
  {
    id: "TCKT-003",
    summary: "Order not delivered",
    issueType: "Delivery",
    additionalNotes: "Customer reports order delayed beyond ETA.",
    status: "Blocked",
    assignedToEngineer: false,
  },
  {
    id: "TCKT-004",
    summary: "Refund request pending",
    issueType: "Refund",
    additionalNotes: "User requested a refund 7 days ago but no update.",
    status: "Completed",
    assignedToEngineer: true,
  }
];

/**
 * Loads tickets from localStorage and merges with sample tickets.
 */
export const getTickets = () => {
  if (typeof window !== "undefined") {
    let tickets = JSON.parse(localStorage.getItem("tickets")) || [];

    // Merge sample tickets if they are missing
    const mergedTickets = [...tickets];

    SAMPLE_TICKETS.forEach(sampleTicket => {
      if (!tickets.some(ticket => ticket.id === sampleTicket.id)) {
        mergedTickets.push(sampleTicket);
      }
    });

    localStorage.setItem("tickets", JSON.stringify(mergedTickets));
    return mergedTickets;
  }
  return [];
};

/**
 * Append a new ticket to localStorage.
 */
export const createTicket = (ticket) => {
  if (typeof window !== "undefined") {
    const tickets = getTickets();
    const updatedTickets = [...tickets, ticket];
    localStorage.setItem("tickets", JSON.stringify(updatedTickets));
  }
};

/**
 * Update the status of a specific ticket.
 */
export const updateTicketStatus = (ticketId, newStatus) => {
  const tickets = getTickets();
  const updatedTickets = tickets.map(ticket =>
    ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
  );
  localStorage.setItem("tickets", JSON.stringify(updatedTickets));
};

/**
 * Assign a ticket to an engineer.
 */
export const assignTicketToEngineer = (ticketId, assignedToEngineer) => {
  const tickets = getTickets();
  const updatedTickets = tickets.map(ticket =>
    ticket.id === ticketId ? { ...ticket, assignedToEngineer } : ticket
  );
  localStorage.setItem("tickets", JSON.stringify(updatedTickets));
};

/**
 * Unassign a ticket from an engineer.
 */
export const unassignTicket = (ticketId) => {
  const tickets = getTickets();
  const updatedTickets = tickets.map(ticket =>
    ticket.id === ticketId ? { ...ticket, assignedToEngineer: false } : ticket
  );
  localStorage.setItem("tickets", JSON.stringify(updatedTickets));
};
