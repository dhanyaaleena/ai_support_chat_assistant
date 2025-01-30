import { Box } from "@chakra-ui/react";

const Message = ({ type, text }) => {
  return (
    <Box
      p={3}
      borderRadius="md"
      bg={type === "user" ? "blue.500" : "gray.300"}
      color={type === "user" ? "white" : "black"}
      alignSelf={type === "user" ? "flex-end" : "flex-start"}
      maxWidth="70%"
    >
      {text}
    </Box>
  );
};

export default Message;
