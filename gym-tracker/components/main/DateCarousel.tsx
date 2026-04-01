import { Pressable, Text, View } from "react-native";
import { useState } from "react";
import { StyleSheet } from "react-native"; 
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { getCurrentDate } from "@/utils/dateFormat";

type DateCarouselProps = {
    selectedDate?: Date;
    onChangeDate?: (date: Date) => void;
};

export default function DateCarousel({ selectedDate, onChangeDate }: DateCarouselProps) {

    const [internalSelectedDate, setInternalSelectedDate] = useState(
        () => new Date(getCurrentDate())
    );

    const activeDate = selectedDate ?? internalSelectedDate;

    function formatDate(date: Date) {
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    }

    function changeDay (amt: number) {
        const next = new Date(activeDate);
        next.setDate(activeDate.getDate() + amt);

        if (!selectedDate) {
            setInternalSelectedDate(next);
        }

        onChangeDate?.(next);
    }

    return (
        <View style={styles.datePill}>
            <Pressable onPress={() => changeDay(-1)}>
                <Ionicons name="chevron-back" size={20} color="#888" />
            </Pressable>
            <Text style={styles.dateText}>{formatDate(activeDate)}</Text>
            <Pressable onPress={() => changeDay(1)}>
                <Ionicons name="chevron-forward" size={20} color="#888" />
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
    paddingVertical: 10,
},
  dateText: {
    flex: 1,                
    textAlign: "center",    
    color: "#888",
    fontSize: 14,
},
  arrowContainer: {
    width: 40,              
    alignItems: "center",
},
});