import { useState, useEffect, useRef } from "react";
import { Box, Input, Button, VStack, Text, Avatar, Flex, IconButton, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, useDisclosure } from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import Sidebar from './Sidebar';
import { createTicket } from '../utils/localStorage';

const generateConversationId = () => `conv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const generateTicketId = () => `ticket-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const toast = useToast();
  const messageEndRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showTicketButton, setShowTicketButton] = useState(false);

  // Sample questions array
  const sampleQuestions = [
    "How do I reset my password?",
    "How do I update my shipping address?",
    "What is your return policy?",
    "How do I track my order?",
  ];

  useEffect(() => {
    setConversationId(generateConversationId());
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (messages.length === 2) {
      setShowTicketButton(true);
    }
  }, [messages]);

  const handleSend = async (message = input) => {
    const finalMessage = message.trim();
    if (!finalMessage) return;

    // Add user message to chat
    setMessages(prev => [...prev, { text: finalMessage, sender: "user" }]);
    
    // Clear input only if it's from the input field
    if (message === input) setInput("");

    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${baseURL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: finalMessage, 
          conversation_id: conversationId 
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch response from the server.");

      const data = await response.json();
      
      // Add AI response to chat
      setMessages(prev => [
        ...prev,
        { text: data.ai_response.generated_text, sender: "ai" }
      ]);

      // Handle ticket creation
      if (data.ai_response.ticket_details) {
        const ticketId = generateTicketId();
        const newTicket = {
          id: ticketId,
          summary: data.ai_response.ticket_details.summary,
          issueType: data.ai_response.ticket_details.category,
          status: "Open",
          additionalNotes: data.ai_response.ticket_details.additional_notes
        };

        createTicket(newTicket);
        toast({
          description: `Ticket Created: ${newTicket.summary} (ID: ${ticketId})`,
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
  const handleTicketPrompt = () => {
    setMessages(prev => [...prev, { text: "Would you like to create a support ticket? (y/n)", sender: "ai" }]);
    setShowTicketButton(false);
  };

  return (
    <Flex direction="row" height="100vh">
      {/* Sidebar components remain unchanged */}
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
      {/* Chat Interface*/}

      <Box bg="gray.800" color="white" flex="1" display="flex" flexDirection="column" p={4}>
        <IconButton
          icon={<HamburgerIcon />}
          aria-label="Open menu"
          display={{ base: "block", md: "none" }}
          position="absolute"
          top="4"
          left="4"
          onClick={onOpen}
          bg="gray.700"
          _hover={{ bg: "gray.600" }}
        />

        <Box flex="1" overflowY="auto" mb={4}>
          <VStack spacing={4} align="stretch">
            {messages.length === 0 ? (
              <VStack spacing={3} align="center" mt={10}>
                <Text align="center" color="gray.500" fontSize="6xl" fontWeight="bold">
                  How can I help you?
                </Text>
                <Text align="center" color="gray.400" fontSize="lg" width="75%">
                  Ask me anything about eCommerce support or profile-related queries based on our FAQ data! 
                  If you need further assistance, I can create a support ticket for you.
                </Text>

                {/* Updated Sample Questions Section */}
                <VStack spacing={2} align="center" mt={4}>
                  <Text color="gray.400" fontSize="md" fontWeight="semibold">
                    Try asking:
                  </Text>
                  <Flex wrap="wrap" gap={2} justify="center">
                    {sampleQuestions.map((question, index) => (
                      <Button
                        key={index}
                        colorScheme="teal"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSend(question)}
                        whiteSpace="normal"
                        textAlign="left"
                        height="auto"
                        py={2}
                      >
                        {question}
                      </Button>
                    ))}
                  </Flex>
                </VStack>
              </VStack>
            ) : (
              messages.map((msg, index) => (
                <Flex
                  key={index}
                  align="center"
                  justify={msg.sender === "user" ? "flex-end" : "flex-start"}
                  direction="row"
                >
                  <Avatar 
                    size="sm" 
                    name={msg.sender === "user" ? "You" : "AI Assistant"} 
                    bg={msg.sender === "user" ? "blue.500" : "gray.500"} 
                  />
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
                    <Text whiteSpace="pre-wrap">{msg.text}</Text>
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
          <Button 
            colorScheme="blue" 
            onClick={() => handleSend()}
            bg="blue.700" 
            _hover={{ bg: "blue.600" }}
          >
            Send
          </Button>
          {showTicketButton && (
            <Button colorScheme="teal" onClick={() => handleSend("Can you create a support ticket for my issue?")} ml={2}>
              Create Ticket
            </Button>
          )}
        </Flex>
      </Box>
    </Flex>
  );
};

export default ChatInterface;