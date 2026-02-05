
import { MOTIVATIONAL_QUOTES } from "../constants";

const STORAGE_KEY_LAST_SHOWN = 'motivation_last_shown_date';
const STORAGE_KEY_LAST_QUOTE_ID = 'motivation_last_quote_id';

export interface MotivationalQuote {
    id: number;
    text: string;
    category: string;
}

export const MotivationService = {
    /**
     * Get a random quote, avoiding repetition of the immediately previous quote.
     */
    getRandomQuote: (): MotivationalQuote => {
        const lastId = Number(localStorage.getItem(STORAGE_KEY_LAST_QUOTE_ID) || -1);
        
        // Filter out the last shown quote to avoid immediate repetition
        const availableQuotes = MOTIVATIONAL_QUOTES.filter(q => q.id !== lastId);
        
        const randomIndex = Math.floor(Math.random() * availableQuotes.length);
        const selectedQuote = availableQuotes[randomIndex];

        // Save this as the last shown
        localStorage.setItem(STORAGE_KEY_LAST_QUOTE_ID, selectedQuote.id.toString());
        
        return selectedQuote;
    },

    /**
     * Checks if a daily quote should be shown (First open of the day).
     * Returns the quote if yes, null if already shown today.
     */
    checkDailyQuote: (): MotivationalQuote | null => {
        const today = new Date().toISOString().split('T')[0];
        const lastShownDate = localStorage.getItem(STORAGE_KEY_LAST_SHOWN);

        if (lastShownDate !== today) {
            const quote = MotivationService.getRandomQuote();
            localStorage.setItem(STORAGE_KEY_LAST_SHOWN, today);
            return quote;
        }
        
        return null;
    }
};
