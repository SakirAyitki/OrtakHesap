import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "react-native";
import AuthNavigator from "./src/navigation/AuthNavigator";
import { AuthProvider } from "./src/context/AuthContext";

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
