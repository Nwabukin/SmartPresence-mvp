import 'dart:convert';
import 'dart:async';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../constants/app_constants.dart';
import 'storage_service.dart';

class ApiService {
  final StorageService _storageService = StorageService();
  
  // Central helpers for user-friendly errors and BaseResponse unwrapping
  dynamic _unwrapBaseResponse(dynamic json) {
    if (json is Map<String, dynamic> && json.containsKey('success') && json.containsKey('data')) {
      return json['data'];
    }
    return json;
  }

  String _mapServerError(int status, dynamic raw, String fallback) {
    final serverMsg = (raw is Map<String, dynamic>) ? (raw['message'] ?? raw['error']) : null;
    if (status >= 500) return 'Server error. Please try again later.';
    if (status == 401) return serverMsg?.toString() ?? 'Authentication failed. Please log in again.';
    if (status == 403) return serverMsg?.toString() ?? 'Access denied. You do not have permission.';
    if (status == 404) return serverMsg?.toString() ?? 'Requested resource not found.';
    if (status == 409) return serverMsg?.toString() ?? 'Request conflict. Please review and try again.';
    return serverMsg?.toString() ?? fallback;
  }

  String _mapNetworkError(Object e) {
    if (e is TimeoutException) return 'Request timed out. Please check your internet connection.';
    if (e is SocketException) return 'Please check your internet connection.';
    if (e is HandshakeException) return 'Secure connection failed. Please try again later.';
    return 'Network error. Please try again.';
  }
  
  // Get headers with authentication
  Future<Map<String, String>> _getHeaders() async {
    final token = await _storageService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // Login
  Future<Map<String, dynamic>> login(String matricNumber, String password) async {
    try {
      final url = '${AppConstants.baseUrl}${AppConstants.loginEndpoint}';
      final body = jsonEncode({
        'matricNo': matricNumber, // Backend expects 'matricNo', not 'matricNumber'
        'password': password,
      });
      
      print('🔗 API Request: POST $url');
      print('📤 Request Body: $body');
      
      final response = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: body,
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Request timeout - please check your network connection');
        },
      );
      
      print('📥 Response Status: ${response.statusCode}');
      print('📥 Response Body: ${response.body}');

      Map<String, dynamic> raw;
      try {
        raw = jsonDecode(response.body);
      } catch (e) {
        print('❌ JSON Parse Error: $e');
        return {
          'success': false,
          'message': 'Invalid response from server: ${response.body}',
        };
      }
      final data = _unwrapBaseResponse(raw);
      
      if (response.statusCode == 200) {
        // Backend returns: { token, user: { id, email, role, firstName, lastName } }
        return {
          'success': true,
          'token': data['token'],
          'user': data['user'],
        };
      } else {
        return {
          'success': false,
          'message': _mapServerError(response.statusCode, raw, 'Login failed'),
        };
      }
    } catch (e) {
      print('❌ Network Error: $e');
      print('❌ Error Type: ${e.runtimeType}');
      if (e.toString().contains('SocketException')) {
        print('❌ Socket Exception - Network connectivity issue');
      } else if (e.toString().contains('TimeoutException')) {
        print('❌ Timeout Exception - Request took too long');
      } else if (e.toString().contains('HandshakeException')) {
        print('❌ Handshake Exception - SSL/TLS issue');
      }
      return {
        'success': false,
        'message': _mapNetworkError(e),
      };
    }
  }

  // Get current user data
  Future<Map<String, dynamic>> getMe() async {
    try {
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}${AppConstants.meEndpoint}'),
        headers: await _getHeaders(),
      );

      final raw = jsonDecode(response.body);
      final data = _unwrapBaseResponse(raw);
      
      if (response.statusCode == 200) {
        // Backend returns: { user_id, email, first_name, last_name, profile: { matric_no, department, course, level, phone } }
        return {
          'success': true,
          'student': {
            'userId': data['user_id'],
            'email': data['email'],
            'firstName': data['first_name'],
            'lastName': data['last_name'],
            'matricNumber': data['profile']['matric_no'],
            'department': data['profile']['department'],
            'courseOfStudy': data['profile']['course'],
            'level': data['profile']['level'],
            'phoneNumber': data['profile']['phone'],
            'createdAt': DateTime.now().toIso8601String(), // Backend doesn't return this, so we'll use current time
          },
        };
      } else {
        return {
          'success': false,
          'message': _mapServerError(response.statusCode, raw, 'Failed to get user data'),
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': _mapNetworkError(e),
      };
    }
  }

  // Get classes
  Future<Map<String, dynamic>> getClasses() async {
    try {
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}${AppConstants.classesEndpoint}'),
        headers: await _getHeaders(),
      );

      final raw = jsonDecode(response.body);
      final data = _unwrapBaseResponse(raw);
      
      if (response.statusCode == 200) {
        // Backend returns array directly: [{ class_id, name, description, created_at, teacher_id, teacher_first_name, teacher_last_name }]
        return {
          'success': true,
          'classes': data,
        };
      } else {
        return {
          'success': false,
          'message': _mapServerError(response.statusCode, raw, 'Failed to get classes'),
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': _mapNetworkError(e),
      };
    }
  }

  // Get sessions
  Future<Map<String, dynamic>> getSessions() async {
    try {
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}${AppConstants.sessionsEndpoint}'),
        headers: await _getHeaders(),
      );

      final raw = jsonDecode(response.body);
      final data = _unwrapBaseResponse(raw);
      
      if (response.statusCode == 200) {
        // Backend returns array directly: [{ session_id, class_id, room_id, start_time, end_time, class_name, room_name, wifi_ssid, bluetooth_beacon_id }]
        return {
          'success': true,
          'sessions': data,
        };
      } else {
        return {
          'success': false,
          'message': _mapServerError(response.statusCode, raw, 'Failed to get sessions'),
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': _mapNetworkError(e),
      };
    }
  }

  // Mark attendance
  Future<Map<String, dynamic>> markAttendance({
    required int classId,
    required int sessionId,
    required String? wifiSSID,
    required String? bluetoothBeaconId,
    required String? deviceId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}${AppConstants.attendanceEndpoint}'),
        headers: await _getHeaders(),
        body: jsonEncode({
          'class_id': classId, // Backend expects class_id
          'session_id': sessionId, // Backend expects session_id
          'wifi_ssid': wifiSSID, // Backend expects wifi_ssid
          'bluetooth_beacon_id': bluetoothBeaconId, // Backend expects bluetooth_beacon_id
          'device_id': deviceId, // Backend expects device_id
        }),
      );

      final raw = jsonDecode(response.body);
      final data = _unwrapBaseResponse(raw);
      
      if (response.statusCode == 201) { // Backend returns 201 for successful attendance marking
        return {
          'success': true,
          'message': 'Attendance marked successfully',
          'data': data,
        };
      } else {
        return {
          'success': false,
          'message': _mapServerError(response.statusCode, raw, 'Failed to mark attendance'),
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': _mapNetworkError(e),
      };
    }
  }

  // Get attendance history
  Future<Map<String, dynamic>> getAttendanceHistory() async {
    try {
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}${AppConstants.attendanceHistoryEndpoint}'),
        headers: await _getHeaders(),
      );

      final raw = jsonDecode(response.body);
      final data = _unwrapBaseResponse(raw);
      
      if (response.statusCode == 200) {
        // Backend returns array directly: [{ record_id, session_id, marked_at, status, class_id, start_time, end_time, class_name }]
        return {
          'success': true,
          'attendance': data,
        };
      } else {
        return {
          'success': false,
          'message': _mapServerError(response.statusCode, raw, 'Failed to get attendance history'),
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': _mapNetworkError(e),
      };
    }
  }

  // Get notifications
  Future<Map<String, dynamic>> getNotifications() async {
    try {
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}${AppConstants.notificationsEndpoint}'),
        headers: await _getHeaders(),
      );

      final raw = jsonDecode(response.body);
      final data = _unwrapBaseResponse(raw);
      
      if (response.statusCode == 200) {
        // Backend returns: { notifications: [...], pagination: {...} }
        return {
          'success': true,
          'notifications': data['notifications'],
          'pagination': data['pagination'],
        };
      } else {
        return {
          'success': false,
          'message': _mapServerError(response.statusCode, raw, 'Failed to get notifications'),
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': _mapNetworkError(e),
      };
    }
  }

  // Get unread notification count
  Future<Map<String, dynamic>> getUnreadNotificationCount() async {
    try {
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}${AppConstants.unreadCountEndpoint}'),
        headers: await _getHeaders(),
      );

      final raw = jsonDecode(response.body);
      final data = _unwrapBaseResponse(raw);
      
      if (response.statusCode == 200) {
        // Backend returns: { unread_count: 3 }
        return {
          'success': true,
          'count': data['unread_count'],
        };
      } else {
        return {
          'success': false,
          'message': _mapServerError(response.statusCode, raw, 'Failed to get unread count'),
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': _mapNetworkError(e),
      };
    }
  }

  // Mark notification as read
  Future<Map<String, dynamic>> markNotificationAsRead(int notificationId) async {
    try {
      final response = await http.put(
        Uri.parse('${AppConstants.baseUrl}${AppConstants.markNotificationReadEndpoint}/$notificationId/read'),
        headers: await _getHeaders(),
      );

      final raw = jsonDecode(response.body);
      final data = _unwrapBaseResponse(raw);
      
      if (response.statusCode == 200) {
        // Backend returns: { notification_id, is_read, read_at }
        return {
          'success': true,
          'data': data,
        };
      } else {
        return {
          'success': false,
          'message': _mapServerError(response.statusCode, raw, 'Failed to mark notification as read'),
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': _mapNetworkError(e),
      };
    }
  }

  // Mark all notifications as read
  Future<Map<String, dynamic>> markAllNotificationsAsRead() async {
    try {
      final response = await http.put(
        Uri.parse('${AppConstants.baseUrl}${AppConstants.markNotificationReadEndpoint}/mark-all-read'),
        headers: await _getHeaders(),
      );

      final raw = jsonDecode(response.body);
      final data = _unwrapBaseResponse(raw);
      
      if (response.statusCode == 200) {
        // Backend returns: { message: "Marked 3 notifications as read", updated_count: 3 }
        return {
          'success': true,
          'message': data['message'],
          'updated_count': data['updated_count'],
        };
      } else {
        return {
          'success': false,
          'message': _mapServerError(response.statusCode, raw, 'Failed to mark all notifications as read'),
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': _mapNetworkError(e),
      };
    }
  }
}
