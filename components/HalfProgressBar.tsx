import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Flame } from 'lucide-react-native';
import Colors from '../constants/Colors';

type Props = {
    progress: number;
    size?: number;
    strokeWidth?: number;
    segments?: number;
    gapAngle?: number;
    value?: string | number;
    label?: string;
};

export default function SegmentedHalfCircleProgress({
    progress,
    size = 200,
    strokeWidth = 26,
    segments = 12,
    gapAngle = 4,
    value,
    label,
}: Props) {
   const clamped = Math.max(0, Math.min(1, progress)); 
   const radius = (size - strokeWidth) / 2; 
   const cx = size / 2;
   const cy = size / 2;

   const TOTAL_ANGLE = 180;
   const totalGapSpace = gapAngle * (segments - 1);
   const segmentAngle = (TOTAL_ANGLE - totalGapSpace) / segments;

   const activeSegments = Math.round(clamped * segments);

   const polarToCartesian = (angle: number) => {
    const rad = (Math.PI / 180) * angle;
    return {
        x: cx + radius * Math.cos(rad),
        y: cy + radius * Math.sin(rad)
    };
   };

   const createArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);

    return `
    M ${start.x} ${start.y}
    A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}
    `;
   };

   // We start at 180 (left) and go to 360 (right) through the top (270)
   let currentAngle = 180;

   return (
   <View style={[styles.container, { width: size, height: size / 2 + 10 }]}>
     <Svg width={size} height={size / 2 + 10}>
     {Array.from({ length: segments }).map((_, i) => {
        const start = currentAngle;
        const end = currentAngle + segmentAngle;
        
        // Update currentAngle for next segment
        currentAngle = end + gapAngle;
        
        const isActive = i < activeSegments;
        return (
            <Path
            key={i}
            d={createArc(start, end)}
            stroke={isActive ? '#2D9C5E' : '#E8F5E9'}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            fill="none"
            />
        );
     })}
     </Svg>
     <View style={styles.textOverlay}>
       <Flame size={24} color="#FF7043" fill="#FF7043" style={styles.icon} />
       <Text style={styles.mainText}>{value}</Text>
       <Text style={styles.subText}>{label}</Text>
     </View>
   </View>
   );   
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center', 
        justifyContent: 'flex-end',
        marginTop: 20,
        marginBottom: 30, // Increased to give room for lowered text
        alignSelf: 'center',
    },
    textOverlay: {
        position: 'absolute',
        bottom: -20, // Lowered the text further
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        marginBottom: 4,
    },
    mainText: {
        fontSize: 36,
        fontWeight: '800',
        color: Colors.text,
        lineHeight: 40,
    },
    subText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textMuted,
        marginTop: 2,
    },
});
