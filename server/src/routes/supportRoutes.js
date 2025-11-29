import { Router } from 'express';
import {
  createTicket,
  getTickets,
  getTicketById,
  replyToTicket,
  updateTicketStatus,
} from '../controllers/supportController.js';
import { requireSignin, isAdmin } from '../helpers/authMiddleware.js';

const router = Router();

// Route to get all tickets for the logged-in user (or all tickets for admins) and create new tickets
router.route('/')
  .get(requireSignin, getTickets)
  .post(requireSignin, createTicket);

// Route to get a specific ticket by its ID
router.route('/:id')
  .get(requireSignin, getTicketById);

// Route for users and admins to reply to a ticket
router.route('/:id/reply')
  .post(requireSignin, replyToTicket);

// Route for admins to update the status of a ticket (e.g., to "CLOSED")
router.route('/:id/status')
  .put(requireSignin, isAdmin, updateTicketStatus);

export default router;
