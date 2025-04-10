import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import AuthNavigator from "./src/navigation/AuthNavigator";

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />
        <AuthNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
