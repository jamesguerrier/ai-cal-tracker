import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Utensils, Droplets, History, ClipboardList, Flame } from 'lucide-react-native';
import Colors from '../constants/Colors';

interface ActivityItem {
  id: string;
  name: string;
  calories?: number;
  water?: number;
  type?: string;
  createdAt: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
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
        {activities.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View 
              style={[
                styles.iconContainer, 
                { 
                  backgroundColor: 
                    activity.type === 'exercise' ? Colors.primary + '15' :
                    activity.water ? '#3B82F615' : 
                    Colors.primary + '15' 
                }
              ]}
            >
              {activity.type === 'exercise' ? (
                <Flame size={20} color={Colors.primary} />
              ) : activity.water ? (
                <Droplets size={20} color="#3B82F6" />
              ) : (
                <Utensils size={20} color={Colors.primary} />
              )}
            </View>
            
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>{activity.name}</Text>
              <Text style={styles.activityTime}>{formatTime(activity.createdAt)}</Text>
            </View>

            <View style={styles.activityValue}>
              <Text style={[
                styles.valueText,
                activity.type === 'exercise' && { color: Colors.primary }
              ]}>
                {activity.water 
                  ? `${activity.water}L` 
                  : activity.type === 'exercise'
                    ? `-${activity.calories} cal`
                    : `+${activity.calories} cal`}
              </Text>
            </View>
          </View>
        ))}
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
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  activityValue: {
    alignItems: 'flex-end',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
});
