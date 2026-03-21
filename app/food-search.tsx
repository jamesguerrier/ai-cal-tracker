import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, ChevronRight, Calculator } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchFood } from '../utils/fatsecret';
import Colors from '../constants/Colors';

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function FoodSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.trim().length < 3) {
        setResults([]);
        return;
      }

      setLoading(true);
      const foodResults = await searchFood(debouncedQuery);
      setResults(foodResults);
      setLoading(false);
    };

    performSearch();
  }, [debouncedQuery]);

  const renderFoodItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.foodCard}
      onPress={() => {
        // For now just log, eventually navigate to log food with these details
        console.log('Selected food:', item);
      }}
    >
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        {item.brand && <Text style={styles.brandName}>{item.brand}</Text>}
        <Text style={styles.servingInfo}>{item.serving}</Text>
        
        <View style={styles.nutritionRow}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{item.calories}</Text>
            <Text style={styles.nutritionLabel}>CAL</Text>
          </View>
          <View style={styles.nutritionDivider} />
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{item.protein}g</Text>
            <Text style={styles.nutritionLabel}>PRO</Text>
          </View>
          <View style={styles.nutritionDivider} />
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{item.carbs}g</Text>
            <Text style={styles.nutritionLabel}>CARB</Text>
          </View>
          <View style={styles.nutritionDivider} />
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{item.fat}g</Text>
            <Text style={styles.nutritionLabel}>FAT</Text>
          </View>
        </View>
      </View>
      <ChevronRight size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={28} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Search Food</Text>
            </View>

            <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                <Search size={20} color={Colors.textMuted} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Pizza, Burger, Chicken..."
                  value={query}
                  onChangeText={setQuery}
                  placeholderTextColor={Colors.textMuted}
                  autoFocus
                />
                {loading && <ActivityIndicator size="small" color={Colors.primary} />}
              </View>
            </View>

            <FlatList
              data={results}
              renderItem={renderFoodItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  {query.trim().length >= 3 ? (
                    !loading && <Text style={styles.emptyText}>No results found for "{query}"</Text>
                  ) : (
                    <>
                      <View style={styles.iconCircle}>
                        <Search size={40} color={Colors.primary} />
                      </View>
                      <Text style={styles.emptyTitle}>Find your food</Text>
                      <Text style={styles.emptySubtitle}>
                        Search millions of foods from the FatSecret database.
                      </Text>
                    </>
                  )}
                </View>
              )}
            />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginLeft: 16,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    height: '100%',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  foodCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  brandName: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  servingInfo: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  nutritionLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '700',
    marginTop: 2,
  },
  nutritionDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
    opacity: 0.5,
  },
  emptyContainer: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
