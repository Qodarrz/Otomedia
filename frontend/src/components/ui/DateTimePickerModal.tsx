import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../constants/theme';

interface DateTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (dateString: string) => void;
  initialDate?: string;
}

export default function DateTimePickerModal({ visible, onClose, onSelect, initialDate }: DateTimePickerModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [h1, setH1] = useState("1");
  const [h2, setH2] = useState("2");
  const [m1, setM1] = useState("0");
  const [m2, setM2] = useState("0");
  const [ampm, setAmpm] = useState("AM");

  const h1Ref = useRef<TextInput>(null);
  const h2Ref = useRef<TextInput>(null);
  const m1Ref = useRef<TextInput>(null);
  const m2Ref = useRef<TextInput>(null);

  useEffect(() => {
    if (initialDate && visible) {
      let d = new Date(initialDate);
      if (initialDate.includes('T')) {
        const parts = initialDate.split(/[-T:]/).map(Number);
        if (parts.length >= 5) {
          d = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4]);
        }
      }
      if (!isNaN(d.getTime())) {
        setCurrentDate(d);
        setSelectedDate(d);
        
        let hrs = d.getHours();
        const isPM = hrs >= 12;
        setAmpm(isPM ? "PM" : "AM");
        
        hrs = hrs % 12;
        if (hrs === 0) hrs = 12;
        
        const hrsStr = hrs.toString().padStart(2, '0');
        const minsStr = d.getMinutes().toString().padStart(2, '0');
        
        setH1(hrsStr[0]);
        setH2(hrsStr[1]);
        setM1(minsStr[0]);
        setM2(minsStr[1]);
      }
    }
  }, [initialDate, visible]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleApply = () => {
    const finalDate = new Date(selectedDate);
    
    let hours = parseInt(h1 + h2, 10);
    if (isNaN(hours)) hours = 0;
    if (hours > 12) hours = 12;
    
    let minutes = parseInt(m1 + m2, 10);
    if (isNaN(minutes)) minutes = 0;
    if (minutes > 59) minutes = 59;
    
    if (ampm === "PM" && hours !== 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    
    finalDate.setHours(hours);
    finalDate.setMinutes(minutes);
    
    const year = finalDate.getFullYear();
    const month = (finalDate.getMonth() + 1).toString().padStart(2, '0');
    const day = finalDate.getDate().toString().padStart(2, '0');
    const hrsStr = finalDate.getHours().toString().padStart(2, '0');
    const minsStr = finalDate.getMinutes().toString().padStart(2, '0');
    
    onSelect(`${year}-${month}-${day}T${hrsStr}:${minsStr}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Pressable onPress={prevMonth} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
            </Pressable>
            <Text style={styles.monthText}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</Text>
            <Pressable onPress={nextMonth} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textDark} />
            </Pressable>
          </View>

          <View style={styles.weekDays}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <Text key={day} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected = selectedDate.getDate() === dayNum && selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear();
              return (
                <Pressable
                  key={dayNum}
                  style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  onPress={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum))}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{dayNum}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.timeSection}>
            <Text style={styles.timeLabel}>Time:</Text>
            
            <View style={styles.timeInputsWrapper}>
              <View style={styles.digitGroup}>
                <TextInput
                  ref={h1Ref}
                  style={styles.digitInput}
                  keyboardType="numeric"
                  maxLength={1}
                  value={h1}
                  onChangeText={(val) => { setH1(val.replace(/[^0-9]/g, '')); if (val) h2Ref.current?.focus(); }}
                  selectTextOnFocus
                />
                <TextInput
                  ref={h2Ref}
                  style={styles.digitInput}
                  keyboardType="numeric"
                  maxLength={1}
                  value={h2}
                  onChangeText={(val) => { setH2(val.replace(/[^0-9]/g, '')); if (val) m1Ref.current?.focus(); }}
                  selectTextOnFocus
                />
              </View>
              
              <Text style={styles.timeSeparator}>:</Text>
              
              <View style={styles.digitGroup}>
                <TextInput
                  ref={m1Ref}
                  style={styles.digitInput}
                  keyboardType="numeric"
                  maxLength={1}
                  value={m1}
                  onChangeText={(val) => { setM1(val.replace(/[^0-9]/g, '')); if (val) m2Ref.current?.focus(); }}
                  selectTextOnFocus
                />
                <TextInput
                  ref={m2Ref}
                  style={styles.digitInput}
                  keyboardType="numeric"
                  maxLength={1}
                  value={m2}
                  onChangeText={(val) => { setM2(val.replace(/[^0-9]/g, '')); }}
                  selectTextOnFocus
                />
              </View>
            </View>

            <View style={styles.ampmToggle}>
              <Pressable 
                style={[styles.ampmBtn, ampm === "AM" && styles.ampmBtnActive]}
                onPress={() => setAmpm("AM")}
              >
                <Text style={[styles.ampmText, ampm === "AM" && styles.ampmTextActive]}>AM</Text>
              </Pressable>
              <Pressable 
                style={[styles.ampmBtn, ampm === "PM" && styles.ampmBtnActive]}
                onPress={() => setAmpm("PM")}
              >
                <Text style={[styles.ampmText, ampm === "PM" && styles.ampmTextActive]}>PM</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable style={[styles.btn, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.applyBtn]} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 360,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navBtn: {
    padding: 8,
  },
  monthText: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.textDark,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDayText: {
    fontFamily: FONTS.medium,
    color: COLORS.textGray,
    width: 32,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  dayText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textDark,
  },
  dayTextSelected: {
    color: COLORS.textWhite,
    fontFamily: FONTS.bold,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  timeLabel: {
    fontFamily: FONTS.medium,
    color: COLORS.textDark,
  },
  timeInputsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  digitGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  digitInput: {
    width: 32,
    height: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 8,
    textAlign: 'center',
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textDark,
  },
  timeSeparator: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.textDark,
    marginHorizontal: 8,
  },
  ampmToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  ampmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  ampmBtnActive: {
    backgroundColor: COLORS.primary,
  },
  ampmText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.textGray,
  },
  ampmTextActive: {
    color: COLORS.textWhite,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  cancelBtn: {
    backgroundColor: COLORS.surface,
  },
  cancelBtnText: {
    fontFamily: FONTS.medium,
    color: COLORS.textGray,
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
  },
  applyBtnText: {
    fontFamily: FONTS.bold,
    color: COLORS.textWhite,
  },
});
