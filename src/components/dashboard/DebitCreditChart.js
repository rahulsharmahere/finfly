import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function DebitCreditChart({ debitCreditData = [0, 0], dateRange }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        Debit vs Credit ({dateRange.start.format('DD MMM')} - {dateRange.end.format('DD MMM')})
      </Text>
      <BarChart
        data={{ labels: ['Debit', 'Credit'], datasets: [{ data: debitCreditData }] }}
        width={screenWidth - 64}
        height={220}
        yAxisLabel="₹"
        fromZero
        showValuesOnTopOfBars
        chartConfig={{
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 2,
          color: (o=1) => `rgba(33,150,243,${o})`,
          labelColor: (o=1) => `rgba(0,0,0,${o})`
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 }
});
