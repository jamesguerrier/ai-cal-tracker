import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Utensils, Droplet, History, ClipboardList, Flame, Dumbbell } from 'lucide-react-native';
import Colors from '../constants/Colors';

interface ActivityItem {
  id: string;
  name: string;
  title?: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  water?: number;
  type?: string;
  source?: 'camera' | 'gallery' | 'manual';
  createdAt: string;
  duration?: number;
  intensity?: string;
  exerciseType?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  onEdit?: (activity: ActivityItem) => void;
}

export default function RecentActivity({ activities, onEdit }: RecentActivityProps) {
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const getExerciseIcon = (type?: string, name?: string) => {
    const lowerName = name?.toLowerCase() || '';
    if (type === 'run' || lowerName.includes('run') || lowerName.includes('walk')) {
      return <History size={20} color={Colors.primary} />;
    }
    if (type === 'weights' || lowerName.includes('lift') || lowerName.includes('gym')) {
      return <Dumbbell size={20} color={Colors.primary} />;
    }
    return <Flame size={20} color={Colors.primary} />;
  };

  if (activities.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Recent Activity</Text>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <ClipboardList size={40} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptySubtitle}>
            Log your first meal or drink to start tracking your progress for today!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Activity</Text>
      <View style={styles.list}>
        {activities.map((activity) => {
          const isExercise = activity.type === 'exercise';
          
          return (
            <View key={activity.id} style={styles.activityItem}>
              {/* Icon Section */}
              <View 
                style={[
                  styles.iconContainer, 
                  { 
                    backgroundColor: 
                      isExercise ? Colors.primary + '15' :
                      activity.water ? '#3B82F615' : 
                      Colors.primary + '15' 
                  }
                ]}
              >
                {isExercise ? (
                  getExerciseIcon(activity.exerciseType, activity.name)
                ) : activity.water ? (
                  <Droplet size={20} color="#3B82F6" />
                ) : (
                  <Utensils size={20} color={Colors.primary} />
                )}
              </View>
              
              {/* Info Section */}
              <View style={styles.activityInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.activityName} numberOfLines={1} ellipsizeMode="tail">
                    {activity.name || activity.title}
                  </Text>
                  <Text style={styles.activityTime}>{formatTime(activity.createdAt)}</Text>
                </View>

                {isExercise ? (
                  <View style={styles.exerciseDetails}>
                    <View style={styles.caloriesRow}>
                      <Flame size={14} color={Colors.primary} style={styles.smallIcon} />
                      <Text style={styles.caloriesBurned}>{activity.calories} cal burned</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>Intensity: <Text style={styles.metaValue}>{activity.intensity || 'Medium'}</Text></Text>
                      <View style={styles.bullet} />
                      <Text style={styles.metaText}>Duration: <Text style={styles.metaValue}>{activity.duration || 0} min</Text></Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.mealDetails}>
                    <View style={styles.macroDetailsRow}>
                      <View>
                        <Text style={styles.valueText}>
                          {activity.water 
                            ? `${activity.water.toFixed(2)}L` 
                            : `+${activity.calories} kcal`}
                        </Text>
                        {!isExercise && !activity.water && (
                          <View style={styles.sourceTag}>
                            <Text style={styles.sourceText}>
                              {activity.source === 'gallery' ? 'Uploaded' : 'Scanned'}
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      {!activity.water && (activity.protein !== undefined) && (
                        <View style={styles.macroRowSmall}>
                          <Text style={styles.macroSmallText}><Text style={{fontWeight: '800', color: '#F87171'}}>P</Text> {activity.protein}g</Text>
                          <View style={styles.bullet} />
                          <Text style={styles.macroSmallText}><Text style={{fontWeight: '800', color: '#FBBF24'}}>F</Text> {activity.fat}g</Text>
                          <View style={styles.bullet} />
                          <Text style={styles.macroSmallText}><Text style={{fontWeight: '800', color: '#60A5FA'}}>C</Text> {activity.carbs}g</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
                
                {/* Edit Button */}
                <TouchableOpacity 
                  style={styles.editCardBtn} 
                  onPress={() => onEdit?.(activity)}
                >
                  <Flame size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  emptyState: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  list: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  exerciseDetails: {
    gap: 4,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallIcon: {
    marginRight: 2,
  },
  caloriesBurned: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  metaValue: {
    color: Colors.text,
    fontWeight: '600',
  },
  bullet: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
    opacity: 0.5,
  },
  macroDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 2,
  },
  mealDetails: {
    marginTop: 2,
  },
  activityValue: {
    alignItems: 'flex-end',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  macroRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroSmallText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  sourceTag: {
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  sourceText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  editCardBtn: {
    padding: 8,
    marginLeft: 8,
    opacity: 0.6,
  },
});
