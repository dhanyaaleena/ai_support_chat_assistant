import { Box, Table, Thead, Tbody, Tr, Th, Td, Button, Flex, Select } from '@chakra-ui/react';
import { useState, useEffect } from 'react';  // Import useState and useEffect
import { getTickets, updateTicketStatus, assignTicketToEngineer, unassignTicket } from '../../utils/localStorage';
import Sidebar from '../../components/Sidebar'; // Import Sidebar component

export default function AdminView() {
  // Use state to manage tickets
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    // Load tickets from localStorage when the component mounts
    setTickets(getTickets());
  }, []); // Empty dependency array means this runs only once on mount

  const handleStatusChange = (ticketId, newStatus) => {
    // Update the ticket status
    updateTicketStatus(ticketId, newStatus);
    
    // Manually update the local state so the UI re-renders
    const updatedTickets = tickets.map((ticket) => 
      ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
    );
    setTickets(updatedTickets); // Update state with the new ticket status
  };

  const handleAssign = (ticketId) => {
    // Simulate assigning the ticket to an engineer
    // You could use a real engineer ID or just a boolean to track the assignment
    assignTicketToEngineer(ticketId, true); // You can replace `true` with an actual engineer ID

    // Update state so UI reflects the new assignment
    const updatedTickets = tickets.map((ticket) => 
      ticket.id === ticketId ? { ...ticket, assignedToEngineer: true } : ticket
    );
    setTickets(updatedTickets);
  };

  const handleUnassign = (ticketId) => {
    // Unassign the ticket
    unassignTicket(ticketId);

    // Update state to reflect the unassignment
    const updatedTickets = tickets.map((ticket) => 
      ticket.id === ticketId ? { ...ticket, assignedToEngineer: false } : ticket
    );
    setTickets(updatedTickets);
  };

  return (
    <Flex>
      {/* Sidebar */}
      <Sidebar />

      {/* Admin Dashboard */}
      <Box p={4} bg="gray.800" color="white" minH="250vh" flex="1">
        {/* Scrollable container for the table */}
        <Box overflowX="auto">
          <Table variant="simple" colorScheme="teal" size="sm">
            <Thead>
              <Tr>
                <Th p={2} minWidth="120px">Ticket ID</Th>
                <Th p={2} minWidth="150px">Summary</Th>
                <Th p={2} minWidth="120px">Issue Type</Th>
                <Th p={2} minWidth="150px" maxWidth="200px" isTruncated>Additional Notes</Th>
                <Th p={2} minWidth="120px">Status</Th>
                <Th p={2} minWidth="150px">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {tickets.map((ticket) => (
                <Tr key={ticket.id}>
                  <Td p={2}>{ticket.id}</Td>
                  <Td p={2}>{ticket.summary}</Td>
                  <Td p={2}>{ticket.issueType}</Td>
                  {/* Additional Notes with wrapping */}
                  <Td p={2} style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {ticket.additionalNotes}
                  </Td>
                  <Td p={2}>
                    <Select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                      bg="gray.600"
                      borderColor="gray.500"
                      color="white"
                      size="sm"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Blocked">Blocked</option>
                    </Select>
                  </Td>
                  <Td p={2}>
                    {/* Display Assign button only if the ticket is not already assigned */}
                    {!ticket.assignedToEngineer && ticket.status !== "Assigned to Engineer" && (
                      <Button
                        colorScheme="blue"
                        onClick={() => handleAssign(ticket.id)}
                        size="sm"
                      >
                        Assign to Engineer
                      </Button>
                    )}
                    
                    {/* Display Unassign button if the ticket is assigned */}
                    {ticket.assignedToEngineer && (
                      <Button
                        colorScheme="red"
                        onClick={() => handleUnassign(ticket.id)}
                        size="sm"
                      >
                        Unassign from Engineer
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </Flex>
  );
}
