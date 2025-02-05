import { 
  Box, Table, Thead, Tbody, Tr, Th, Td, Flex, Select, IconButton, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, useBreakpointValue 
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';  
import { getTickets, updateTicketStatus } from '../../utils/localStorage';
import Sidebar from '../../components/Sidebar'; 
import { FiMenu } from 'react-icons/fi';

export default function EngineerView() {
  const [tickets, setTickets] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });

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
    <Flex direction="column" minH="100vh" bg="gray.800" color="white">
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
            <DrawerCloseButton color="white" />
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
        <Box overflowX="auto">
          {/* Ticket Table (Desktop & Mobile) */}
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
