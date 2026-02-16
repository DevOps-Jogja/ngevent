import TelegramBot from 'node-telegram-bot-api';
import logger from './logger';

// Initialize Telegram bot if token is provided
const botToken = process.env.TELEGRAM_BOT_TOKEN;
let bot: TelegramBot | null = null;

if (botToken) {
    bot = new TelegramBot(botToken, { polling: false });
    logger.info('Telegram bot initialized');
} else {
    logger.warn('Telegram bot token not provided. Telegram notifications will be disabled.');
}

const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const TELEGRAM_THREAD_ID = process.env.TELEGRAM_THREAD_ID || '';

interface EventRegistrationData {
    eventTitle: string;
    eventId: string;
    eventDate: string;
    eventLocation: string;
    userName: string;
    userEmail: string;
    userPhone?: string;
    userInstitution?: string;
    userPosition?: string;
    userCity?: string;
    totalRegistrations?: number;
    capacity?: number;
    paymentProofUrl?: string;
}

/**
 * Send event registration notification to Telegram
 */
export const sendEventRegistrationToTelegram = async (data: EventRegistrationData) => {
    if (!bot || !TELEGRAM_CHAT_ID) {
        logger.warn('Telegram bot not configured. Skipping Telegram notification.');
        return;
    }

    try {
        const registrationInfo = data.totalRegistrations !== undefined
            ? data.capacity
                ? `\n📊 <b>Total Pendaftar:</b> ${data.totalRegistrations} / ${data.capacity}`
                : `\n📊 <b>Total Pendaftar:</b> ${data.totalRegistrations}`
            : '';

        const message = `
🎉 <b>Pendaftaran Event Baru</b>

📌 <b>Event:</b> ${data.eventTitle}
🆔 <b>Event ID:</b> ${data.eventId}
📅 <b>Tanggal:</b> ${new Date(data.eventDate).toLocaleString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })}
📍 <b>Lokasi:</b> ${data.eventLocation}${registrationInfo}

👤 <b>Peserta:</b>
• Nama: ${data.userName}
• Email: ${data.userEmail}
${data.userPhone ? `• Telepon: ${data.userPhone}` : ''}
${data.userInstitution ? `• Institusi: ${data.userInstitution}` : ''}
${data.userPosition ? `• Posisi: ${data.userPosition}` : ''}
${data.userCity ? `• Kota: ${data.userCity}` : ''}
    `.trim();

        const options: any = {
            parse_mode: 'HTML',
        };

        // Add message_thread_id if thread ID is provided
        if (TELEGRAM_THREAD_ID) {
            options.message_thread_id = parseInt(TELEGRAM_THREAD_ID);
            logger.info(`Sending to thread ID: ${TELEGRAM_THREAD_ID}`);
        }

        try {
            // Send payment proof image if available
            if (data.paymentProofUrl) {
                // Check if it's an image (not PDF)
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(data.paymentProofUrl);
                
                if (isImage) {
                    // Send photo with caption
                    await bot.sendPhoto(TELEGRAM_CHAT_ID, data.paymentProofUrl, {
                        caption: message,
                        parse_mode: 'HTML',
                        ...(TELEGRAM_THREAD_ID ? { message_thread_id: parseInt(TELEGRAM_THREAD_ID) } : {}),
                    });
                    logger.info(`Telegram notification with payment proof sent for: ${data.eventTitle}`);
                } else {
                    // If PDF or other format, send message then document
                    await bot.sendMessage(TELEGRAM_CHAT_ID, message, options);
                    await bot.sendDocument(TELEGRAM_CHAT_ID, data.paymentProofUrl, {
                        caption: '📎 Bukti Pembayaran',
                        ...(TELEGRAM_THREAD_ID ? { message_thread_id: parseInt(TELEGRAM_THREAD_ID) } : {}),
                    });
                    logger.info(`Telegram notification with payment document sent for: ${data.eventTitle}`);
                }
            } else {
                // No payment proof, send message only
                await bot.sendMessage(TELEGRAM_CHAT_ID, message, options);
                logger.info(`Telegram notification sent for event registration: ${data.eventTitle}`);
            }
        } catch (threadError: any) {
            // If thread message fails, try without thread as fallback
            if (TELEGRAM_THREAD_ID && threadError) {
                logger.warn(`Failed to send to thread ${TELEGRAM_THREAD_ID}, trying without thread...`);
                logger.warn(`Thread error: ${threadError.message || threadError}`);

                delete options.message_thread_id;
                
                // Retry based on payment proof availability
                if (data.paymentProofUrl) {
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(data.paymentProofUrl);
                    if (isImage) {
                        await bot.sendPhoto(TELEGRAM_CHAT_ID, data.paymentProofUrl, {
                            caption: message,
                            parse_mode: 'HTML',
                        });
                    } else {
                        await bot.sendMessage(TELEGRAM_CHAT_ID, message, options);
                        await bot.sendDocument(TELEGRAM_CHAT_ID, data.paymentProofUrl, {
                            caption: '📎 Bukti Pembayaran',
                        });
                    }
                } else {
                    await bot.sendMessage(TELEGRAM_CHAT_ID, message, options);
                }
                logger.info(`Telegram notification sent without thread for: ${data.eventTitle}`);
            } else {
                throw threadError;
            }
        }
    } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        const errorResponse = error?.response?.body || '';
        logger.error('Failed to send Telegram notification:', {
            error: errorMessage,
            response: errorResponse,
            chatId: TELEGRAM_CHAT_ID,
            threadId: TELEGRAM_THREAD_ID || 'none',
            eventTitle: data.eventTitle
        });
        // Don't throw error - notification failure shouldn't break registration
    }
};

/**
 * Send custom message to Telegram
 */
export const sendTelegramMessage = async (message: string, useThread = true) => {
    if (!bot || !TELEGRAM_CHAT_ID) {
        logger.warn('Telegram bot not configured. Skipping Telegram notification.');
        return;
    }

    try {
        const options: any = {
            parse_mode: 'HTML',
        };

        // Add message_thread_id if thread ID is provided and useThread is true
        if (TELEGRAM_THREAD_ID && useThread) {
            options.message_thread_id = parseInt(TELEGRAM_THREAD_ID);
        }

        try {
            await bot.sendMessage(TELEGRAM_CHAT_ID, message, options);
            logger.info('Telegram message sent successfully');
        } catch (threadError: any) {
            // If thread message fails and we were using thread, try without thread
            if (TELEGRAM_THREAD_ID && useThread && threadError) {
                logger.warn(`Failed to send to thread, trying without thread...`);
                delete options.message_thread_id;
                await bot.sendMessage(TELEGRAM_CHAT_ID, message, options);
                logger.info('Telegram message sent without thread');
            } else {
                throw threadError;
            }
        }
    } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        logger.error('Failed to send Telegram message:', {
            error: errorMessage,
            chatId: TELEGRAM_CHAT_ID,
            threadId: TELEGRAM_THREAD_ID || 'none',
        });
        throw error;
    }
};

/**
 * Test Telegram bot configuration
 */
export const testTelegramConnection = async (): Promise<boolean> => {
    if (!bot || !TELEGRAM_CHAT_ID) {
        logger.warn('Telegram bot not configured');
        return false;
    }

    try {
        const testMessage = '🔔 <b>Test Connection</b>\n\nTelegram bot terhubung dengan sukses!';
        const options: any = {
            parse_mode: 'HTML',
        };

        if (TELEGRAM_THREAD_ID) {
            options.message_thread_id = parseInt(TELEGRAM_THREAD_ID);
            logger.info(`Testing with thread ID: ${TELEGRAM_THREAD_ID}`);
        }

        await bot.sendMessage(TELEGRAM_CHAT_ID, testMessage, options);
        logger.info('Telegram connection test successful');
        return true;
    } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        logger.error('Telegram connection test failed:', {
            error: errorMessage,
            chatId: TELEGRAM_CHAT_ID,
            threadId: TELEGRAM_THREAD_ID || 'none',
        });
        return false;
    }
};

/**
 * Check if Telegram bot is configured
 */
export const isTelegramConfigured = (): boolean => {
    return !!(bot && TELEGRAM_CHAT_ID);
};
