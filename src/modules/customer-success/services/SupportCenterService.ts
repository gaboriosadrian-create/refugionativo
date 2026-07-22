import { CustomerSuccessDb } from './CustomerSuccessDb';
import { SupportTicket, TicketComment, TicketStatus, TicketPriority, TicketCategory, AuditLog } from '../types';

export class SupportCenterService {
  /**
   * Retrieves support tickets for a specific tenant.
   */
  public static getTickets(tenantId: string): SupportTicket[] {
    return CustomerSuccessDb.getAll<SupportTicket>('supportTickets').filter(t => t.tenantId === tenantId);
  }

  /**
   * Retrieves all support tickets across tenants (for support agents / super admins).
   */
  public static getAllTickets(): SupportTicket[] {
    return CustomerSuccessDb.getAll<SupportTicket>('supportTickets');
  }

  /**
   * Creates a new support ticket.
   */
  public static createTicket(params: {
    tenantId: string;
    userId: string;
    userEmail: string;
    userName: string;
    subject: string;
    description: string;
    priority: TicketPriority;
    category: TicketCategory;
    attachments?: string[];
  }): SupportTicket {
    const tickets = CustomerSuccessDb.getAll<SupportTicket>('supportTickets');
    const newId = `tkt-${1000 + tickets.length + 1}`;
    
    const newTicket: SupportTicket = {
      id: newId,
      tenantId: params.tenantId,
      subject: params.subject,
      description: params.description,
      status: 'Nuevo',
      priority: params.priority,
      category: params.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      attachments: params.attachments || [],
      history: [
        {
          timestamp: new Date().toISOString(),
          action: 'Ticket creado por el usuario',
          actor: params.userName
        }
      ]
    };

    tickets.push(newTicket);
    CustomerSuccessDb.setAll('supportTickets', tickets);

    // Write audit log
    this.writeAuditLog({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: 'client',
      action: 'TICKET_CREATED',
      details: `Ticket ${newId} creado: ${params.subject}`
    });

    return newTicket;
  }

  /**
   * Updates a ticket status (state transition) and records history and metrics.
   */
  public static updateTicketStatus(
    ticketId: string, 
    status: TicketStatus, 
    actorName: string, 
    actorRole: 'client' | 'agent' | 'customer_success' | 'super_admin',
    actorId: string,
    actorEmail: string
  ): SupportTicket | null {
    const tickets = CustomerSuccessDb.getAll<SupportTicket>('supportTickets');
    const ticketIdx = tickets.findIndex(t => t.id === ticketId);
    if (ticketIdx === -1) return null;

    const ticket = tickets[ticketIdx];
    const oldStatus = ticket.status;
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    
    // Add history item
    ticket.history.push({
      timestamp: new Date().toISOString(),
      action: `Estado cambiado de "${oldStatus}" a "${status}"`,
      actor: actorName
    });

    // Calculate response / resolution times if transitioning
    const createdDate = new Date(ticket.createdAt).getTime();
    const currentDate = new Date().getTime();
    
    if (oldStatus === 'Nuevo' && status === 'En revisión' && !ticket.firstResponseTimeMinutes) {
      ticket.firstResponseTimeMinutes = Math.round((currentDate - createdDate) / 60000);
    }

    if (status === 'Resuelto' || status === 'Cerrado') {
      ticket.resolutionTimeMinutes = Math.round((currentDate - createdDate) / 60000);
    }

    CustomerSuccessDb.setAll('supportTickets', tickets);

    // Audit log
    this.writeAuditLog({
      userId: actorId,
      userEmail: actorEmail,
      userRole: actorRole,
      action: 'TICKET_STATUS_UPDATED',
      details: `Ticket ${ticketId} cambiado de ${oldStatus} a ${status} por ${actorName}`
    });

    return ticket;
  }

  /**
   * Add a comment to a ticket.
   */
  public static addComment(params: {
    ticketId: string;
    content: string;
    userId: string;
    userEmail: string;
    userName: string;
    userRole: 'client' | 'agent' | 'customer_success' | 'super_admin';
    isInternal?: boolean;
  }): TicketComment {
    const comments = CustomerSuccessDb.getAll<TicketComment>('ticketComments');
    const newId = `cmt-${comments.length + 1}`;

    const newComment: TicketComment = {
      id: newId,
      ticketId: params.ticketId,
      content: params.content,
      createdAt: new Date().toISOString(),
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      userRole: params.userRole,
      isInternal: params.isInternal || false
    };

    comments.push(newComment);
    CustomerSuccessDb.setAll('ticketComments', comments);

    // Update ticket's updatedAt
    const tickets = CustomerSuccessDb.getAll<SupportTicket>('supportTickets');
    const tIdx = tickets.findIndex(t => t.id === params.ticketId);
    if (tIdx !== -1) {
      const ticket = tickets[tIdx];
      ticket.updatedAt = new Date().toISOString();
      
      // Auto-transition status on client or agent reply
      if (params.userRole === 'client' && ticket.status === 'Esperando cliente') {
        ticket.status = 'En progreso';
        ticket.history.push({
          timestamp: new Date().toISOString(),
          action: 'El cliente respondió. Estado actualizado a "En progreso"',
          actor: params.userName
        });
      } else if ((params.userRole === 'agent' || params.userRole === 'customer_success') && ticket.status === 'Nuevo') {
        ticket.status = 'En progreso';
        ticket.history.push({
          timestamp: new Date().toISOString(),
          action: 'Soporte respondió. Estado actualizado a "En progreso"',
          actor: params.userName
        });
        
        if (!ticket.firstResponseTimeMinutes) {
          const createdDate = new Date(ticket.createdAt).getTime();
          const currentDate = new Date().getTime();
          ticket.firstResponseTimeMinutes = Math.round((currentDate - createdDate) / 60000);
        }
      }

      CustomerSuccessDb.setAll('supportTickets', tickets);
    }

    // Audit log
    this.writeAuditLog({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      action: 'TICKET_COMMENT_ADDED',
      details: `Comentario agregado al ticket ${params.ticketId} por ${params.userName}`
    });

    return newComment;
  }

  /**
   * Retrieves comments for a support ticket.
   */
  public static getComments(ticketId: string, showInternal: boolean = false): TicketComment[] {
    const comments = CustomerSuccessDb.getAll<TicketComment>('ticketComments').filter(c => c.ticketId === ticketId);
    if (!showInternal) {
      return comments.filter(c => !c.isInternal);
    }
    return comments;
  }

  /**
   * Writes a global audit log.
   */
  private static writeAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const logs = CustomerSuccessDb.getAll<AuditLog>('auditLogs');
    const newLog: AuditLog = {
      id: `aud-${logs.length + 1}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    logs.push(newLog);
    CustomerSuccessDb.setAll('auditLogs', logs);
  }

  /**
   * Retrieves the complete audit logs.
   */
  public static getAuditLogs(): AuditLog[] {
    return CustomerSuccessDb.getAll<AuditLog>('auditLogs').sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
}
