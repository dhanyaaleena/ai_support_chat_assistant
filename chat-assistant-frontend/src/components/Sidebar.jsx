import { VStack, Button, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Code } from "@chakra-ui/react";
import { useRouter } from "next/router";
// Import JSON data
import referenceData from '../../public/faq_data.json'; // Adjust the path based on your file structure

const Sidebar = () => {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure(); // Chakra modal hooks

  return (
    <VStack
      p={4}
      bg="gray.700"
      color="white"
      minH="100vh"
      spacing={6}
      align="stretch"
      borderRight="1px solid" 
      borderColor="gray.600"
    >
      <Button
        onClick={() => router.push("/user")}
        variant="ghost"
        _hover={{ bg: "gray.600" }}
        color="white"
        fontWeight="bold"
      >
        User Chat
      </Button>
      <Button
        onClick={() => router.push("/admin")}
        variant="ghost"
        _hover={{ bg: "gray.600" }}
        color="white"
        fontWeight="bold"
      >
        Admin Dashboard
      </Button>
      <Button
        onClick={() => router.push("/engineer")}
        variant="ghost"
        _hover={{ bg: "gray.600" }}
        color="white"
        fontWeight="bold"
      >
        Engineer Dashboard
      </Button>

      {/* Add the "Reference" button */}
      <Button
        onClick={onOpen}
        variant="ghost"
        _hover={{ bg: "gray.600" }}
        color="white"
        fontWeight="bold"
        mt="auto" // Pushes this button to the bottom
      >
        Reference
      </Button>

      {/* Modal to display JSON data */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white" maxWidth="90vw" width="80vw">
          <ModalHeader>Reference Data</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Code 
              display="block" 
              whiteSpace="pre-wrap" 
              colorScheme="white"
              bg="gray.700" // Match sidebar's background color
              borderRadius="md" // Rounded corners for a cleaner look
              maxWidth="100%" 
              minWidth="500px" // Set a minimum width for better readability
              overflowX="auto" // Allows horizontal scrolling if the content is wide
            >
              {JSON.stringify(referenceData, null, 2)}
            </Code>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default Sidebar;
