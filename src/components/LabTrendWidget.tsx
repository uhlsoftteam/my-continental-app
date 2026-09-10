import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { getLabAnalysis } from '../services/api';
import { getSafeRange } from '../utils/labReferenceRanges';

const fmt = (d?: string | null) => {
  if (!d) return "—";
  try {
    let dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) {
      const parts = d.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
      if (parts) {
        const [_, day, month, year] = parts;
        dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    }
    if (isNaN(dateObj.getTime())) {
      return d;
    }
    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

export const LabTrendWidget = ({ testCode, title, accentColor = "#8D4956", patient }: any) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const patientDemographics = {
    dob: patient?.dateOfBirth || patient?.dob,
    gender: patient?.gender,
  };
  const safeRange = getSafeRange(testCode, patientDemographics);

  useEffect(() => {
    loadData();
  }, [testCode]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await getLabAnalysis(testCode);
      
      let analysisData = [];
      if (Array.isArray(res?.data)) {
        analysisData = res.data;
      } else if (Array.isArray(res?.data?.data)) {
        analysisData = res.data.data;
      }

      const chartData = analysisData
        .filter((d: any) => (d.resultData ?? d.result) !== undefined && (d.resultData ?? d.result) !== null)
        .map((d: any) => {
          const rawRes = d.resultData ?? d.result;
          const val = parseFloat(rawRes);
          const datePart = d.resultDate ? d.resultDate.split(" ")[0] : "";
          return {
            date: fmt(datePart),
            timestamp: datePart ? new Date(datePart.split("-").reverse().join("-")).getTime() : 0,
            result: isNaN(val) ? 0 : val,
            rawResult: rawRes,
            reference: d.reference
          };
        })
        .sort((a: any, b: any) => a.timestamp - b.timestamp);
        
      setData(chartData);
    } catch (err) {
      console.log('Error fetching lab analysis', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.card, { borderColor: accentColor + '20', justifyContent: 'center' }]}>
        <ActivityIndicator color={accentColor} />
      </View>
    );
  }

  if (error || data.length === 0) {
    return null; // hide if no data
  }

  const latestResult = data[data.length - 1];
  const previousResult = data.length > 1 ? data[data.length - 2] : null;
  const reference = latestResult.reference && latestResult.reference !== "null" 
    ? latestResult.reference 
    : safeRange ? `${safeRange[0]} - ${safeRange[1]}` : "N/A";

  const isOutOfRange = safeRange && (latestResult.result < safeRange[0] || latestResult.result > safeRange[1]);
  const resultColor = isOutOfRange ? '#ef4444' : accentColor;

  let statusText = '';
  let statusColor = accentColor;
  let statusBg = `${accentColor}15`;

  if (safeRange) {
    if (latestResult.result < safeRange[0]) {
      statusText = 'Low';
      statusColor = '#ef4444';
      statusBg = '#fef2f2';
    } else if (latestResult.result > safeRange[1]) {
      statusText = 'High';
      statusColor = '#ef4444';
      statusBg = '#fef2f2';
    } else {
      statusText = 'Normal';
      statusColor = '#22c55e';
      statusBg = '#f0fdf4';
    }
  }

  let trendIcon = 'minus';
  let trendColor = '#94A3B8';
  if (previousResult) {
    if (latestResult.result > previousResult.result) {
      trendIcon = 'arrow-up';
      trendColor = '#ef4444'; // red for up
    } else if (latestResult.result < previousResult.result) {
      trendIcon = 'arrow-down';
      trendColor = '#22c55e'; // green for down
    }
  }

  let allVals = data.map(d => d.result);
  if (safeRange) {
    allVals.push(safeRange[0]);
    allVals.push(safeRange[1]);
  }
  let maxVal = Math.max(...allVals);
  let minVal = Math.min(...allVals);
  
  if (maxVal === minVal) {
    maxVal += 10;
    minVal -= 10;
  }
  const rangePadding = (maxVal - minVal) * 0.1;
  maxVal += rangePadding;
  minVal = Math.max(0, minVal - rangePadding);
  const range = maxVal - minVal;

  return (
    <View style={[styles.card, { borderTopColor: accentColor }]}>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <Text style={styles.reference} numberOfLines={1}>Ref: {reference}</Text>
      
      <View style={styles.resultContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
          <Text style={[styles.latestValue, { color: resultColor }]}>{latestResult.rawResult}</Text>
          {statusText ? (
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>
          ) : null}
        </View>
        {previousResult && (
          <View style={[styles.trendBadge, { backgroundColor: trendColor + '15' }]}>
            <FontAwesome5 name={trendIcon} size={10} color={trendColor} />
            <Text style={[styles.trendText, { color: trendColor }]}>
              {Math.abs(latestResult.result - previousResult.result).toFixed(1)}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.dateText}>{latestResult.date}</Text>

      {/* Mini Bar Chart */}
      <View style={{ marginTop: 'auto', height: 75 }}>
        {/* Chart Drawing Area */}
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }}>
          
          {/* Green Zone Background */}
          {safeRange && (
            <View 
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `${((safeRange[0] - minVal) / (range || 1)) * 100}%`,
                height: `${((safeRange[1] - safeRange[0]) / (range || 1)) * 100}%`,
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: 'rgba(34, 197, 94, 0.2)',
                zIndex: 0,
              }}
            />
          )}

          {/* Dots */}
          {data.slice(-5).map((d, i) => {
            const heightPercent = Math.max(((d.result - minVal) / (range || 1)) * 100, 2);
            const barOutOfRange = safeRange && (d.result < safeRange[0] || d.result > safeRange[1]);
            return (
              <View key={`bar-${i}`} style={{ height: '100%', width: 30, alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <View 
                  style={{ 
                    position: 'absolute',
                    bottom: `${heightPercent}%`,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: barOutOfRange ? '#ef4444' : accentColor,
                    borderWidth: 2,
                    borderColor: '#fff',
                    transform: [{ translateY: 5 }],
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 1,
                    elevation: 2
                  }} 
                />
              </View>
            );
          })}
        </View>

        {/* Labels Area */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 4, marginTop: 2 }}>
          {data.slice(-5).map((d, i) => (
             <View key={`label-${i}`} style={{ width: 30, alignItems: 'center' }}>
               <Text style={styles.barLabel}>{d.date.split(' ')[0]}</Text>
             </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderBottomColor: '#F1F5F9',
    borderLeftColor: '#F1F5F9',
    borderRightColor: '#F1F5F9',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
    marginBottom: 4
  },
  reference: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#64748B',
    marginBottom: 12
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  latestValue: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginRight: 8
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  trendText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    marginLeft: 4
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  dateText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#94A3B8',
    marginBottom: 16
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
    marginTop: 'auto',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    width: 30
  },
  bar: {
    width: 12,
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 8,
    color: '#94A3B8',
    marginTop: 4,
    fontFamily: 'Inter_500Medium'
  }
});
