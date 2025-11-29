import asyncHandler from 'express-async-handler';
import prisma from '../helpers/prisma.js';

// @desc    Create a new support ticket
// @route   POST /api/support
// @access  Private
export const createTicket = asyncHandler(async (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    res.status(400);
    throw new Error('Please provide a subject and message');
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      subject,
      user: { connect: { id: req.user.id } },
      messages: {
        create: {
          content: message,
          sender: { connect: { id: req.user.id } },
        },
      },
    },
    include: {
      messages: true,
    },
  });

  res.status(201).json(ticket);
});

// @desc    Get all tickets for a user or all tickets if admin
// @route   GET /api/support
// @access  Private
export const getTickets = asyncHandler(async (req, res) => {
  const where = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN' 
    ? {} 
    : { userId: req.user.id };

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  res.json(tickets);
});

// @desc    Get a single ticket by ID
// @route   GET /api/support/:id
// @access  Private
export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: req.params.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      messages: {
        include: {
          sender: {
            select: {
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Authorize user
  if (ticket.userId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    res.status(403);
    throw new Error('User not authorized to view this ticket');
  }

  res.json(ticket);
});

// @desc    Reply to a support ticket
// @route   POST /api/support/:id/reply
// @access  Private
export const replyToTicket = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message) {
    res.status(400);
    throw new Error('Please provide a message');
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: req.params.id },
  });

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Authorize user
  if (ticket.userId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    res.status(403);
    throw new Error('User not authorized to reply to this ticket');
  }

  const reply = await prisma.supportMessage.create({
    data: {
      content: message,
      sender: { connect: { id: req.user.id } },
      ticket: { connect: { id: req.params.id } },
    },
    include: {
      sender: {
        select: {
          name: true,
          role: true,
        },
      },
    },
  });

  // Re-open ticket on reply and update timestamp
  await prisma.supportTicket.update({
    where: { id: req.params.id },
    data: {
      status: 'OPEN',
      updatedAt: new Date(),
    },
  });

  res.status(201).json(reply);
});

// @desc    Update ticket status (Admin only)
// @route   PUT /api/support/:id/status
// @access  Private/Admin
export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status || !['OPEN', 'CLOSED'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status. Must be OPEN or CLOSED.');
  }

  const ticket = await prisma.supportTicket.update({
    where: { id: req.params.id },
    data: { status },
    include: { // Include the user details needed for the frontend ManageTicketsPage if we update the list
        user: {
            select: {
                name: true,
                email: true,
            },
        },
    }
  });

  res.json(ticket);
});

