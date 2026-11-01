import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sparkles, RefreshCw, Quote as QuoteIcon } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { Quote } from '../types';
import quoteService from '../services/quoteService';

interface DailyQuoteCardProps {
  streak?: number;
}

export const DailyQuoteCard: React.FC<DailyQuoteCardProps> = ({ streak = 0 }) => {
  const { theme, isDark } = useTheme();
  const [currentQuote, setCurrentQuote] = useState<Quote>(() => quoteService.getDailyQuote(streak));

  const handleNextQuote = () => {
    const next = quoteService.getRandomQuote(currentQuote.id);
    setCurrentQuote(next);
  };

  const categoryColor =
    currentQuote.category === 'inspirational'
      ? theme.primaryLight
      : currentQuote.category === 'humorous'
      ? theme.amberWarning
      : theme.alertLight;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.bgCard,
          borderColor: isDark ? 'rgba(0, 123, 167, 0.25)' : theme.border,
          shadowColor: theme.primary,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <Sparkles size={14} color={theme.primaryLight} />
          <Text style={[styles.badgeLabel, { color: theme.primaryLight }]}>
            Daily Encouragement
          </Text>
        </View>

        <View style={styles.rightActions}>
          <View
            style={[
              styles.categoryPill,
              {
                borderColor: categoryColor,
                backgroundColor: isDark ? 'rgba(10, 14, 20, 0.6)' : theme.primaryContainer,
              },
            ]}
          >
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {currentQuote.category.toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleNextQuote}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <RefreshCw size={14} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.quoteBody}>
        <QuoteIcon
          size={18}
          color={isDark ? 'rgba(0, 123, 167, 0.4)' : 'rgba(0, 123, 167, 0.6)'}
          style={styles.quoteIcon}
        />
        <Text style={[styles.quoteText, { color: theme.textPrimary }]}>
          "{currentQuote.text}"
        </Text>
      </View>

      <Text style={[styles.quoteAuthor, { color: theme.textMuted }]}>
        — {currentQuote.author || 'Health Companion'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryPill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quoteBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 4,
  },
  quoteIcon: {
    marginTop: 2,
  },
  quoteText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    fontStyle: 'italic',
    flex: 1,
  },
  quoteAuthor: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 6,
  },
});
