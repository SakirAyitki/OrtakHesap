import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "react-native";
import AuthNavigator from "./src/navigation/AuthNavigator";

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <AuthNavigator />
    </NavigationContainer>
  );
}
