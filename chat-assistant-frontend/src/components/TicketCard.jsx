import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@chakra-ui/react";

const TicketCard = ({ ticket, onAssign }) => {
  return (
    <Card>
      <CardContent>
        <h2 className="font-semibold">{ticket.summary}</h2>
        <p>Type: {ticket.issueType}</p>
        <p>Status: {ticket.status}</p>
        {/* Add Assign button only if status is not already 'Assigned to Engineer' */}
        {onAssign && ticket.status !== "Assigned to Engineer" && (
          <Button onClick={() => onAssign(ticket.id)}>Assign</Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TicketCard;
