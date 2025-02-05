import { useState, useEffect, useRef } from "react";
import { Box, Input, Button, VStack, Text, Avatar, Flex, IconButton, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, useDisclosure } from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import Sidebar from './Sidebar'; // Import Sidebar component
import { createTicket } from '../utils/localStorage';

// Function to generate a unique conversation ID
const generateConversationId = () => {
  return `conv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

const generateTicketId = () => {
  return `ticket-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null); // Start with null until ID is generated
  const toast = useToast(); // Chakra UI toast hook
  const messageEndRef = useRef(null); // Reference to scroll to the latest message
  const { isOpen, onOpen, onClose } = useDisclosure(); // Drawer for sidebar

  // Generate a new conversation ID when the component mounts
  useEffect(() => {
    const newConversationId = generateConversationId();
    setConversationId(newConversationId);
  }, []);

  // Scroll to the bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
  
    // Add user message to chat
    setMessages([...messages, { text: input, sender: "user" }]);
    setInput("");
  
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL;
      // Call the backend API with the dynamic conversation ID
      const response = await fetch(`${baseURL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input, conversation_id: conversationId }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch response from the server.");
      }
  
      const data = await response.json();
  
      // Add AI response to chat
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: data.ai_response.generated_text, sender: "ai" },
      ]);
  
      // Handle ticket creation if the response includes ticket details
      if (data.ai_response.ticket_details) {
        const ticketId = generateTicketId();
  
        // Create ticket object
        const newTicket = {
          id: ticketId,
          summary: data.ai_response.ticket_details.summary,
          issueType: data.ai_response.ticket_details.category,
          status: "Open", // Initially set  "Open"
          additionalNotes: data.ai_response.ticket_details.additional_notes
        };
  
        // Use createTicket to store the ticket in localStorage
        createTicket(newTicket);
  
        // Display the toast with the new ticket ID
        toast({
          description: `Ticket Created: ${data.ai_response.ticket_details.summary} (ID: ${ticketId})`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        description: "Failed to send message. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error(error);
    }
  };

  return (
    <Flex direction="row" height="100vh">
      {/* Sidebar for desktop */}
      <Box
        width="250px"
        bg="gray.800"
        color="white"
        display={{ base: "none", md: "block" }} // Hide on small screens, show on medium+
      >
        <Sidebar />
      </Box>

      {/* Sidebar Drawer for mobile */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="gray.800" color="white">
          <DrawerHeader display="flex" justifyContent="space-between">
            <Text>Menu</Text>
            <IconButton icon={<CloseIcon />} onClick={onClose} />
          </DrawerHeader>
          <DrawerBody>
            <Sidebar />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Chat Interface */}
      <Box
        bg="gray.800"
        color="white"
        flex="1"
        display="flex"
        flexDirection="column"
        p={4}
      >
        {/* Mobile Menu Button */}
        <IconButton
          icon={<HamburgerIcon />}
          aria-label="Open menu"
          display={{ base: "block", md: "none" }} // Show only on mobile
          position="absolute"
          top="4"
          left="4"
          onClick={onOpen}
          bg="gray.700"
          _hover={{ bg: "gray.600" }}
        />

        {/* Messages container */}
        <Box flex="1" overflowY="auto" mb={4}>
          <VStack spacing={4} align="stretch">
            {messages.length === 0 ? (
              <VStack spacing={3} align="center" mt={10}>
                <Text align="center" color="gray.500" fontSize="6xl" fontWeight="bold">
                  How can I help you?
                </Text>
                <Text align="center" color="gray.400" fontSize="lg" width="75%">
                  Ask me anything about eCommerce support or profile-related queries based on our FAQ data! If you need further assistance, I can create a support ticket for you.
                </Text>
              </VStack>
            ) : (
              messages.map((msg, index) => (
                <Flex
                  key={index}
                  align="center"
                  justify={msg.sender === "user" ? "flex-end" : "flex-start"}
                  direction="row"
                >
                  <Avatar size="sm" name={msg.sender === "user" ? "You" : "AI Assistant"} bg={msg.sender === "user" ? "blue.500" : "gray.500"} />
                  <Box
                    p={3}
                    bg={msg.sender === "user" ? "blue.700" : "gray.600"}
                    borderRadius="md"
                    fontWeight="bold"
                    maxW="80%"
                    ml={msg.sender === "user" ? 3 : 0}
                    mr={msg.sender === "ai" ? 3 : 0}
                  >
                    <Text>{msg.sender === "user" ? "You" : "AI Assistant"}</Text>
                    <Text>{msg.text}</Text>
                  </Box>
                </Flex>
              ))
            )}
            <div ref={messageEndRef} />
          </VStack>
        </Box>

        {/* Input area */}
        <Flex direction="row" align="center" p={4} bg="gray.700" borderRadius="md">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            bg="gray.600"
            borderColor="gray.500"
            color="white"
            flex="1"
            mr={4}
            size="md"
          />
          <Button colorScheme="blue" onClick={handleSend} bg="blue.700" _hover={{ bg: "blue.600" }}>
            Send
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
};

export default ChatInterface;
