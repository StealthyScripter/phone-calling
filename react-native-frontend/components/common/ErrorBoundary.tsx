import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.log('ErrorBoundary caught an error:', error, errorInfo);
    // You can log the error to a crash reporting service here
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 bg-gray-900 items-center justify-center p-6">
          <Ionicons name="warning-outline" size={64} color="#ef4444" />
          
          <Text className="text-white text-xl font-semibold mt-4 mb-2 text-center">
            Something went wrong
          </Text>
          
          <Text className="text-gray-400 text-base text-center mb-6 leading-6">
            We&#39;re sorry for the inconvenience. Please try again or restart the app.
          </Text>

          {__DEV__ && this.state.error && (
            <View className="bg-gray-800 p-4 rounded-lg mb-6 w-full">
              <Text className="text-red-400 text-sm font-mono">
                {this.state.error.toString()}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={this.handleRetry}
            className="bg-green-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
