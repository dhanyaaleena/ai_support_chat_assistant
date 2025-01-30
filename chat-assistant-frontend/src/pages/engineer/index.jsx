import { Box, Table, Thead, Tbody, Tr, Th, Td, Flex, Select } from '@chakra-ui/react';
import { useState, useEffect } from 'react';  
import { getTickets, updateTicketStatus } from '../../utils/localStorage';
import Sidebar from '../../components/Sidebar'; 

export default function EngineerView() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    setTickets(getTickets().filter(ticket => ticket.assignedToEngineer === true)); // Only show assigned tickets
  }, []);

  const handleStatusChange = (ticketId, newStatus) => {
    updateTicketStatus(ticketId, newStatus);
    
    const updatedTickets = tickets.map((ticket) => 
      ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
    );
    setTickets(updatedTickets);
  };

  return (
    <Flex>
      <Sidebar />
      <Box p={4} bg="gray.800" color="white" minH="250vh" flex="1">
        <Box overflowX="auto">
          <Table variant="simple" colorScheme="teal" size="sm">
            <Thead>
              <Tr>
                <Th p={2} minWidth="120px">Ticket ID</Th>
                <Th p={2} minWidth="150px">Summary</Th>
                <Th p={2} minWidth="120px">Issue Type</Th>
                <Th p={2} minWidth="150px" maxWidth="200px" isTruncated>Additional Notes</Th>
                <Th p={2} minWidth="120px">Status</Th>
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
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </Flex>
  );
}
