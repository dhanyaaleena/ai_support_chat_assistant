import { Box, Table, Thead, Tbody, Tr, Th, Td, Button, Flex, Select } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getTickets, updateTicketStatus, assignTicketToEngineer, unassignTicket } from '../../utils/localStorage';
import Sidebar from '../../components/Sidebar';

export default function AdminView() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    // Load tickets from localStorage and merge with sample tickets on app startup
    setTickets(getTickets());
  }, []);

  const handleStatusChange = (ticketId, newStatus) => {
    // Update the status of the ticket in localStorage and state
    updateTicketStatus(ticketId, newStatus);
    const updatedTickets = tickets.map((ticket) => 
      ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
    );
    setTickets(updatedTickets);
  };

  const handleAssign = (ticketId) => {
    // Assign ticket to engineer and update in localStorage and state
    assignTicketToEngineer(ticketId, true);
    const updatedTickets = tickets.map((ticket) => 
      ticket.id === ticketId ? { ...ticket, assignedToEngineer: true } : ticket
    );
    setTickets(updatedTickets);
  };

  const handleUnassign = (ticketId) => {
    // Unassign ticket from engineer and update in localStorage and state
    unassignTicket(ticketId);
    const updatedTickets = tickets.map((ticket) => 
      ticket.id === ticketId ? { ...ticket, assignedToEngineer: false } : ticket
    );
    setTickets(updatedTickets);
  };

  // Function to generate chart data based on ticket status
  const getChartData = () => {
    const statusCounts = tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(statusCounts).map(status => ({
      name: status,
      count: statusCounts[status],
    }));
  };

  return (
    <Flex>
      {/* Sidebar */}
      <Box width="250px" bg="gray.800" color="white" position="fixed" height="100vh">
        <Sidebar />
      </Box>

      {/* Admin Dashboard */}
      <Box p={4} bg="gray.800" color="white" minH="100vh" flex="1" marginLeft="250px">
        {/* Ticket Statistics Graph */}
        <Box bg="gray.700" p={4} mb={6} borderRadius="lg">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        {/* Ticket Table */}
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
                    {!ticket.assignedToEngineer && ticket.status !== "Assigned to Engineer" && (
                      <Button colorScheme="blue" onClick={() => handleAssign(ticket.id)} size="sm">
                        Assign to Engineer
                      </Button>
                    )}
                    {ticket.assignedToEngineer && (
                      <Button colorScheme="red" onClick={() => handleUnassign(ticket.id)} size="sm">
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
