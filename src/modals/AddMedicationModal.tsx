import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { X, Plus, Clock, Pill, Check, Edit3 } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { Medication, PlantType } from '../types';
import { typography } from '../theme/typography';

interface AddMedicationModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (medData: Partial<Medication>) => Promise<void>;
  medicationToEdit?: Medication | null;
}

const COMMON_QUANTITIES = ['1 pill', '2 pills', '1 tablet', '1 tablespoon', '5 ml', '2 drops'];
const DURATION_PRESETS = [
  { label: 'Ongoing (Weekly Cycle)', value: 0 },
  { label: '7 Days (1 Week)', value: 7 },
  { label: '14 Days (2 Weeks)', value: 14 },
  { label: '30 Days (1 Month)', value: 30 },
  { label: '90 Days (3 Months)', value: 90 },
];

export const AddMedicationModal: React.FC<AddMedicationModalProps> = ({
  visible,
  onClose,
  onSave,
  medicationToEdit,
}) => {
  const { theme, isDark } = useTheme();
  const isEditing = !!medicationToEdit;

  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState('');
  const [quantity, setQuantity] = useState('1 pill');
  const [customQuantity, setCustomQuantity] = useState('');
  const [scheduleTimes, setScheduleTimes] = useState<string[]>(['08:00']);
  const [newTimeInput, setNewTimeInput] = useState('20:00');
  const [durationDays, setDurationDays] = useState<number>(0);
  const [customDurationInput, setCustomDurationInput] = useState('');
  const [instructions, setInstructions] = useState('Take with water after meals');
  const [selectedPlant, setSelectedPlant] = useState<PlantType>('Sunflower');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill when editing
  useEffect(() => {
    if (medicationToEdit) {
      setDrugName(medicationToEdit.drugName || '');
      setDosage(medicationToEdit.dosage || '');
      const qty = medicationToEdit.quantity || '1 pill';
      setQuantity(qty);
      if (!COMMON_QUANTITIES.includes(qty)) {
        setCustomQuantity(qty);
      } else {
        setCustomQuantity('');
      }

      if (medicationToEdit.scheduleInterval) {
        const times = medicationToEdit.scheduleInterval
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        setScheduleTimes(times.length > 0 ? times : ['08:00']);
      } else {
        setScheduleTimes(['08:00']);
      }

      const dur = medicationToEdit.durationDays || 0;
      setDurationDays(dur);
      if (dur > 0 && ![7, 14, 30, 90].includes(dur)) {
        setCustomDurationInput(String(dur));
      } else {
        setCustomDurationInput('');
      }

      setInstructions(medicationToEdit.instructions || 'Take with water after meals');
      setSelectedPlant(medicationToEdit.plantType || 'Sunflower');
    } else {
      // Reset form for new entry
      setDrugName('');
      setDosage('');
      setQuantity('1 pill');
      setCustomQuantity('');
      setScheduleTimes(['08:00']);
      setNewTimeInput('20:00');
      setDurationDays(0);
      setCustomDurationInput('');
      setInstructions('Take with water after meals');
      setSelectedPlant('Sunflower');
    }
    setErrorMsg('');
  }, [medicationToEdit, visible]);

  const handleAddTime = () => {
    const clean = newTimeInput.trim();
    if (!clean) return;
    if (!scheduleTimes.includes(clean)) {
      setScheduleTimes([...scheduleTimes, clean].sort());
    }
  };

  const handleRemoveTime = (timeToRemove: string) => {
    if (scheduleTimes.length > 1) {
      setScheduleTimes(scheduleTimes.filter((t) => t !== timeToRemove));
    }
  };

  const handleSave = async () => {
    if (!drugName.trim()) {
      setErrorMsg('Please enter medicine name');
      return;
    }
    if (!dosage.trim()) {
      setErrorMsg('Please specify strength/dosage (e.g. 500mg)');
      return;
    }
    if (scheduleTimes.length === 0) {
      setErrorMsg('Please add at least one intake time');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const finalQuantity = customQuantity.trim() || quantity;
      await onSave({
        _id: medicationToEdit?._id,
        drugName: drugName.trim(),
        dosage: dosage.trim(),
        quantity: finalQuantity,
        scheduleInterval: scheduleTimes.join(', '),
        instructions: instructions.trim(),
        durationDays: durationDays,
        plantType: selectedPlant,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save medication');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#0F131A' : '#FFFFFF',
              borderColor: isDark ? 'rgba(0, 123, 167, 0.3)' : theme.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              {isEditing ? (
                <Edit3 size={20} color={theme.primaryLight} />
              ) : (
                <Pill size={20} color={theme.primaryLight} />
              )}
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                {isEditing ? 'Edit Prescription' : 'Add New Prescription'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? '#1E2430' : '#F1F5F9' },
              ]}
              onPress={onClose}
            >
              <X size={18} color={theme.textSubtle} />
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: theme.alertContainer,
                  borderColor: theme.alertBorder,
                },
              ]}
            >
              <Text style={[styles.errorText, { color: theme.alert }]}>{errorMsg}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* 1. Medication Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Medicine Name *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#0A0D14' : '#F8FAFC',
                    borderColor: isDark ? '#222A38' : '#CBD5E1',
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="e.g. Amoxicillin, Lisinopril, Metformin"
                placeholderTextColor={theme.textMuted}
                value={drugName}
                onChangeText={setDrugName}
              />
            </View>

            {/* 2. Dosage / Strength */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Strength / Unit (Dosage) *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#0A0D14' : '#F8FAFC',
                    borderColor: isDark ? '#222A38' : '#CBD5E1',
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="e.g. 500mg, 10ml, 1 capsule"
                placeholderTextColor={theme.textMuted}
                value={dosage}
                onChangeText={setDosage}
              />
            </View>

            {/* 3. Quantity per Dose */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Amount per Intake
              </Text>
              <View style={styles.chipsRow}>
                {COMMON_QUANTITIES.map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isDark ? '#151B26' : '#F1F5F9',
                        borderColor: isDark ? '#243042' : '#E2E8F0',
                      },
                      quantity === q &&
                        !customQuantity && [
                          styles.chipSelected,
                          {
                            backgroundColor: theme.primaryContainer,
                            borderColor: theme.primary,
                          },
                        ],
                    ]}
                    onPress={() => {
                      setQuantity(q);
                      setCustomQuantity('');
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: theme.textMuted },
                        quantity === q &&
                          !customQuantity && [
                            styles.chipTextSelected,
                            { color: theme.primaryLight },
                          ],
                      ]}
                    >
                      {q}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[
                  styles.textInput,
                  {
                    marginTop: 8,
                    backgroundColor: isDark ? '#0A0D14' : '#F8FAFC',
                    borderColor: isDark ? '#222A38' : '#CBD5E1',
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="Or custom quantity (e.g. 1/2 tablet)"
                placeholderTextColor={theme.textMuted}
                value={customQuantity}
                onChangeText={(val) => {
                  setCustomQuantity(val);
                  setQuantity('');
                }}
              />
            </View>

            {/* 4. Schedule Times */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Intake Times (24h Format)
              </Text>
              <View style={styles.timeChipsRow}>
                {scheduleTimes.map((time) => (
                  <View
                    key={time}
                    style={[
                      styles.timeBadge,
                      {
                        backgroundColor: isDark ? '#1A2433' : theme.primaryContainer,
                        borderColor: isDark ? theme.primaryDark : '#BAE6FD',
                      },
                    ]}
                  >
                    <Clock size={14} color={theme.primaryLight} />
                    <Text style={[styles.timeBadgeText, { color: theme.textPrimary }]}>
                      {time}
                    </Text>
                    {scheduleTimes.length > 1 && (
                      <TouchableOpacity onPress={() => handleRemoveTime(time)}>
                        <X size={14} color={theme.alert} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              <View style={styles.addTimeRow}>
                <TextInput
                  style={[
                    styles.timeInput,
                    {
                      backgroundColor: isDark ? '#0A0D14' : '#F8FAFC',
                      borderColor: isDark ? '#222A38' : '#CBD5E1',
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="e.g. 14:00"
                  placeholderTextColor={theme.textMuted}
                  value={newTimeInput}
                  onChangeText={setNewTimeInput}
                />
                <TouchableOpacity
                  style={[styles.addTimeBtn, { backgroundColor: theme.primary }]}
                  onPress={handleAddTime}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.addTimeBtnText}>Add Time</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 5. Treatment Duration / Dosage Period */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Treatment Course / Duration
              </Text>
              <View style={styles.chipsRow}>
                {DURATION_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.value}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isDark ? '#151B26' : '#F1F5F9',
                        borderColor: isDark ? '#243042' : '#E2E8F0',
                      },
                      durationDays === preset.value &&
                        !customDurationInput && [
                          styles.chipSelected,
                          {
                            backgroundColor: theme.primaryContainer,
                            borderColor: theme.primary,
                          },
                        ],
                    ]}
                    onPress={() => {
                      setDurationDays(preset.value);
                      setCustomDurationInput('');
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: theme.textMuted },
                        durationDays === preset.value &&
                          !customDurationInput && [
                            styles.chipTextSelected,
                            { color: theme.primaryLight },
                          ],
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[
                  styles.textInput,
                  {
                    marginTop: 8,
                    backgroundColor: isDark ? '#0A0D14' : '#F8FAFC',
                    borderColor: isDark ? '#222A38' : '#CBD5E1',
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="Or specify custom days (e.g. 5, 10, 60)"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={customDurationInput}
                onChangeText={(val) => {
                  setCustomDurationInput(val);
                  const parsed = parseInt(val, 10);
                  if (!isNaN(parsed)) setDurationDays(parsed);
                }}
              />
              <Text style={[styles.hintText, { color: theme.textMuted }]}>
                Fixed courses (e.g. 7, 14 days) track progress toward a full harvest. Ongoing courses bloom on a 7-day cycle.
              </Text>
            </View>

            {/* 6. Special Instructions */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Intake Instructions / Notes
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#0A0D14' : '#F8FAFC',
                    borderColor: isDark ? '#222A38' : '#CBD5E1',
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="e.g. Take with water after breakfast"
                placeholderTextColor={theme.textMuted}
                value={instructions}
                onChangeText={setInstructions}
              />
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View
            style={[
              styles.footer,
              { borderTopColor: isDark ? '#1A2230' : '#E2E8F0' },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? '#161C26' : '#F1F5F9',
                  borderColor: isDark ? '#243042' : '#CBD5E1',
                },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: theme.primary },
                isSubmitting && styles.saveBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Check size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>
                    {isEditing ? 'Save Changes' : 'Register Schedule'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '90%',
    padding: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: typography.bold,
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    fontFamily: typography.semiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  scrollArea: {
    maxHeight: 480,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontFamily: typography.semiBold,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: typography.regular,
    fontSize: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipSelected: {
    borderWidth: 1.5,
  },
  chipText: {
    fontFamily: typography.medium,
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextSelected: {
    fontFamily: typography.bold,
    fontWeight: '700',
  },
  timeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  timeBadgeText: {
    fontFamily: typography.bold,
    fontSize: 13,
    fontWeight: '700',
  },
  addTimeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timeInput: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: typography.regular,
    fontSize: 14,
  },
  addTimeBtn: {
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addTimeBtnText: {
    fontFamily: typography.bold,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontFamily: typography.semiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontFamily: typography.extraBold,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  hintText: {
    fontFamily: typography.regular,
    fontSize: 11,
    marginTop: 6,
    lineHeight: 15,
  },
});
