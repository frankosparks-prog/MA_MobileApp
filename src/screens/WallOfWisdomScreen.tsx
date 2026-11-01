import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Sparkles, Quote as QuoteIcon, Heart, Laugh, Lightbulb } from 'lucide-react-native';
import { colors } from '../theme/colors';
import quoteService from '../services/quoteService';
import { Quote } from '../types';

interface WallOfWisdomScreenProps {
  currentStreak?: number;
}

export const WallOfWisdomScreen: React.FC<WallOfWisdomScreenProps> = ({ currentStreak = 20 }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'inspirational' | 'humorous' | 'relatable'>('all');
  const allQuotes = quoteService.getAllQuotes();
  const milestoneQuote = quoteService.getQuoteForStreak(currentStreak);

  const filteredQuotes = selectedCategory === 'all'
    ? allQuotes
    : allQuotes.filter((q) => q.category === selectedCategory);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>Daily Encouragement</Text>
          <Text style={styles.headerTitle}>Wall of Wisdom</Text>
        </View>

        {/* Milestone Quote of the Day */}
        <View style={styles.milestoneCard}>
          <View style={styles.milestoneTag}>
            <Sparkles size={14} color="#07130E" />
            <Text style={styles.milestoneTagText}>Streak Milestone ({currentStreak} Days)</Text>
          </View>
          <Text style={styles.milestoneQuoteText}>"{milestoneQuote.text}"</Text>
          <Text style={styles.milestoneAuthor}>— {milestoneQuote.author}</Text>
        </View>

        {/* Category Pills */}
        <View style={styles.categoriesRow}>
          {[
            { id: 'all', label: 'All' },
            { id: 'inspirational', label: 'Inspirational' },
            { id: 'humorous', label: 'Humorous' },
            { id: 'relatable', label: 'Relatable' },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.id as any)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.id && styles.categoryTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quotes List */}
        {filteredQuotes.map((q) => (
          <View key={q.id} style={styles.quoteCard}>
            <View style={styles.quoteCardHeader}>
              <QuoteIcon size={16} color={colors.emeraldLight} />
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>{q.category}</Text>
              </View>
            </View>
            <Text style={styles.quoteBody}>"{q.text}"</Text>
            {q.author && <Text style={styles.quoteAuthor}>— {q.author}</Text>}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  scrollContent: {
    padding: 18,
    paddingTop: 48,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.emeraldLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  milestoneCard: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    padding: 18,
    marginBottom: 20,
  },
  milestoneTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bloomGold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  milestoneTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#07130E',
  },
  milestoneQuoteText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FEF08A',
    lineHeight: 22,
    marginBottom: 8,
  },
  milestoneAuthor: {
    fontSize: 12,
    color: colors.textSubtle,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryChipActive: {
    backgroundColor: colors.emeraldLight,
    borderColor: colors.emerald,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSubtle,
  },
  categoryTextActive: {
    color: '#07130E',
    fontWeight: '800',
  },
  quoteCard: {
    backgroundColor: 'rgba(15, 33, 25, 0.75)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.18)',
    padding: 16,
    marginBottom: 12,
  },
  quoteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 10,
    color: colors.textSubtle,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  quoteBody: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 6,
  },
  quoteAuthor: {
    fontSize: 11,
    color: colors.textSubtle,
    fontStyle: 'italic',
    textAlign: 'right',
  },
});

