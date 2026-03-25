import { Pressable, Text, View } from "react-native";
import { useState } from "react";
import MaterialIcons from "@expo/vector-icons/build/MaterialIcons";
import { StyleSheet } from "react-native"; 

export default function DateCarousel() {

    const [selectedDate, setSelectedDate] = useState(new Date());

    function formatDate(date: Date) {
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    }

    function changeDay (amt: number) {
        setSelectedDate(prev => {
            const next = new Date(prev);
            next.setDate(prev.getDate() + amt);
            return next;
        });
    }

    return (
        <View style={styles.datePill}>
            <Pressable onPress={() => changeDay(-1)}>
                <Text style={styles.arrow}>‹</Text>
            </Pressable>
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            <Pressable onPress={() => changeDay(1)}>
                <Text style={styles.arrow}>›</Text>
            </Pressable>
        </View>
    );
}


const styles = StyleSheet.create({
  datePill: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
},
  dateText: {
    flex: 1,                
    textAlign: "center",    
    color: "#888",
    fontSize: 14,
},
  arrow: {
    color: "#888",
    fontSize: 18,
  },
  arrowContainer: {
    width: 40,              
    alignItems: "center",
},
});