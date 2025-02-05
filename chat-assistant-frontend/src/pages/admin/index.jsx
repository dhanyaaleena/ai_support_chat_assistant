import { 
  Box, Table, Thead, Tbody, Tr, Th, Td, Button, Flex, Select, 
  useBreakpointValue, IconButton, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton 
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getTickets, updateTicketStatus, assignTicketToEngineer, unassignTicket } from '../../utils/localStorage';
import Sidebar from '../../components/Sidebar';
import { FiMenu } from "react-icons/fi";
import { HamburgerIcon } from '@chakra-ui/icons';

export default function AdminView() {
  const [tickets, setTickets] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    setTickets(getTickets());
  }, []);

  const handleStatusChange = (ticketId, newStatus) => {
    updateTicketStatus(ticketId, newStatus);
    setTickets(tickets.map(ticket => ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket));
  };

  const handleAssign = (ticketId) => {
    assignTicketToEngineer(ticketId, true);
    setTickets(tickets.map(ticket => ticket.id === ticketId ? { ...ticket, assignedToEngineer: true } : ticket));
  };

  const handleUnassign = (ticketId) => {
    unassignTicket(ticketId);
    setTickets(tickets.map(ticket => ticket.id === ticketId ? { ...ticket, assignedToEngineer: false } : ticket));
  };

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
    <Flex direction="column" minH="100vh" bg="gray.800" color="e0e1dd">
      {/* Mobile Sidebar Toggle */}
      {isMobile && (
        <IconButton
          icon={<FiMenu />}
          aria-label="Open Menu"
          onClick={() => setSidebarOpen(true)}
          position="absolute"
          top={2}
          left={2}
          zIndex="1000"
          colorScheme="blue"
          size="sm"
        />
      )}

      {/* Sidebar for Desktop & Mobile Drawer */}
      {!isMobile && (
        <Box width="250px" bg="gray.900" position="fixed" height="100vh">
          <Sidebar />
        </Box>
      )}
      {isMobile && (
        <Drawer isOpen={isSidebarOpen} placement="left" onClose={() => setSidebarOpen(false)}>
          <DrawerOverlay />
          <DrawerContent bg="gray.900" p={4}>
            <DrawerCloseButton color="e0e1dd" />
            <Sidebar />
          </DrawerContent>
        </Drawer>
      )}

      {/* Main Content */}
      <Box 
        p={4} 
        flex="1" 
        ml={isMobile ? 0 : "250px"}
        mt={isMobile ? 12 : 0} // Added margin-top for mobile to avoid overlap with button
      >
        {/* Ticket Statistics Graph */}
        <Box bg="gray.700" p={4} mb={6} borderRadius="lg">
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
            <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        {/* Ticket Table (Desktop) */}
        {!isMobile ? (
          <Box overflowX="auto">
            <Table variant="simple" colorScheme="teal" size="sm">
              <Thead>
                <Tr>
                  <Th>Ticket ID</Th>
                  <Th>Summary</Th>
                  <Th>Issue Type</Th>
                  <Th>Additional Notes</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {tickets.map(ticket => (
                  <Tr key={ticket.id}>
                    <Td>{ticket.id}</Td>
                    <Td>{ticket.summary}</Td>
                    <Td>{ticket.issueType}</Td>
                    <Td>{ticket.additionalNotes}</Td>
                    <Td>
                      <Select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                        bg="gray.600"
                        borderColor="gray.500"
                        color="e0e1dd"
                        size="sm"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Blocked">Blocked</option>
                      </Select>
                    </Td>
                    <Td>
                      {!ticket.assignedToEngineer && ticket.status !== "Assigned to Engineer" && (
                        <Button colorScheme="blue" onClick={() => handleAssign(ticket.id)} size="sm">
                          Assign
                        </Button>
                      )}
                      {ticket.assignedToEngineer && (
                        <Button colorScheme="red" onClick={() => handleUnassign(ticket.id)} size="sm">
                          Unassign
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        ) : (
          // Mobile View: Display tickets in stacked card format
          <Box>
            {tickets.map(ticket => (
              <Box key={ticket.id} p={4} bg="gray.700" mb={4} borderRadius="md">
                <Box fontWeight="bold">ID: {ticket.id}</Box>
                <Box>Summary: {ticket.summary}</Box>
                <Box>Issue Type: {ticket.issueType}</Box>
                <Box>Notes: {ticket.additionalNotes}</Box>
                <Box>
                  <Select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                    bg="gray.600"
                    borderColor="gray.500"
                    color="white"
                    size="sm"
                    mt={2}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
                  </Select>
                </Box>
                <Flex mt={2} gap={2}>
                  {!ticket.assignedToEngineer && ticket.status !== "Assigned to Engineer" && (
                    <Button colorScheme="blue" onClick={() => handleAssign(ticket.id)} size="sm" flex="1">
                      Assign
                    </Button>
                  )}
                  {ticket.assignedToEngineer && (
                    <Button colorScheme="red" onClick={() => handleUnassign(ticket.id)} size="sm" flex="1">
                      Unassign
                    </Button>
                  )}
                </Flex>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Flex>
  );
}
