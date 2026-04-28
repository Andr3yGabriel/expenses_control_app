// lib/services/api_service.dart
//
// Dependências no pubspec.yaml:
//   dio: ^5.4.0
//   flutter_secure_storage: ^9.0.0
//
// Para testes com dispositivo físico iOS, substitua baseUrl
// pelo IP do seu Mac Mini M4 na rede Wi-Fi local.

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// ── Modelos ────────────────────────────────────────────────────────────────────

class User {
  final int id;
  final String name;
  final String email;
  final String createdAt;

  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] as int,
        name: json['name'] as String,
        email: json['email'] as String,
        createdAt: json['created_at'] as String,
      );
}

class Transaction {
  final int id;
  final int userId;
  final String type; // 'income' | 'expense'
  final double amount;
  final String category;
  final String? description;
  final String date;
  final String createdAt;

  const Transaction({
    required this.id,
    required this.userId,
    required this.type,
    required this.amount,
    required this.category,
    this.description,
    required this.date,
    required this.createdAt,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) => Transaction(
        id: json['id'] as int,
        userId: json['user_id'] as int,
        type: json['type'] as String,
        amount: (json['amount'] as num).toDouble(),
        category: json['category'] as String,
        description: json['description'] as String?,
        date: json['date'] as String,
        createdAt: json['created_at'] as String,
      );

  bool get isExpense => type == 'expense';
  bool get isIncome => type == 'income';
}

class TransactionSummary {
  final double totalIncome;
  final double totalExpense;
  final double balance;

  const TransactionSummary({
    required this.totalIncome,
    required this.totalExpense,
    required this.balance,
  });

  factory TransactionSummary.fromJson(Map<String, dynamic> json) =>
      TransactionSummary(
        totalIncome: (json['totalIncome'] as num).toDouble(),
        totalExpense: (json['totalExpense'] as num).toDouble(),
        balance: (json['balance'] as num).toDouble(),
      );
}

class CategorySummary {
  final String category;
  final String type;
  final double total;
  final int count;

  const CategorySummary({
    required this.category,
    required this.type,
    required this.total,
    required this.count,
  });

  factory CategorySummary.fromJson(Map<String, dynamic> json) =>
      CategorySummary(
        category: json['category'] as String,
        type: json['type'] as String,
        total: (json['total'] as num).toDouble(),
        count: json['count'] as int,
      );
}

// ── ApiService ────────────────────────────────────────────────────────────────

class ApiService {
  /// Simulador iOS → localhost funciona diretamente.
  /// Dispositivo físico → use o IP do Mac na rede Wi-Fi:
  ///   Preferências do Sistema → Wi-Fi → Detalhes → endereço IP
  static const String _baseUrl = 'http://localhost:3000';

  final Dio _dio;
  final FlutterSecureStorage _storage;

  ApiService()
      : _dio = Dio(BaseOptions(
          baseUrl: _baseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          headers: {'Content-Type': 'application/json'},
        )),
        _storage = const FlutterSecureStorage(
          iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
        ) {
    _dio.interceptors.add(_buildAuthInterceptor());
  }

  InterceptorsWrapper _buildAuthInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'jwt_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (DioException error, handler) async {
        if (error.response?.statusCode == 401) {
          // Token expirado ou inválido → limpa e força novo login
          await _storage.delete(key: 'jwt_token');
        }
        handler.next(error);
      },
    );
  }

  // ── Auth ───────────────────────────────────────────────────────────────────

  Future<User> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final response = await _dio.post('/auth/register', data: {
      'name': name,
      'email': email,
      'password': password,
    });
    await _storage.write(key: 'jwt_token', value: response.data['token'] as String);
    return User.fromJson(response.data['user'] as Map<String, dynamic>);
  }

  Future<User> login({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    await _storage.write(key: 'jwt_token', value: response.data['token'] as String);
    return User.fromJson(response.data['user'] as Map<String, dynamic>);
  }

  Future<void> logout() async {
    await _storage.delete(key: 'jwt_token');
  }

  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: 'jwt_token');
    return token != null;
  }

  Future<User> getMe() async {
    final response = await _dio.get('/auth/me');
    return User.fromJson(response.data['user'] as Map<String, dynamic>);
  }

  // ── Transactions ───────────────────────────────────────────────────────────

  Future<({List<Transaction> transactions, TransactionSummary summary})>
      getTransactions({
    String? type,
    String? category,
    String? from,
    String? to,
  }) async {
    final response = await _dio.get('/transactions', queryParameters: {
      if (type != null) 'type': type,
      if (category != null) 'category': category,
      if (from != null) 'from': from,
      if (to != null) 'to': to,
    });

    final transactions = (response.data['transactions'] as List)
        .map((e) => Transaction.fromJson(e as Map<String, dynamic>))
        .toList();

    final summary = TransactionSummary.fromJson(
      response.data['summary'] as Map<String, dynamic>,
    );

    return (transactions: transactions, summary: summary);
  }

  Future<Transaction> createTransaction({
    required String type,
    required double amount,
    required String category,
    required String date,
    String? description,
  }) async {
    final response = await _dio.post('/transactions', data: {
      'type': type,
      'amount': amount,
      'category': category,
      'date': date,
      if (description != null) 'description': description,
    });
    return Transaction.fromJson(response.data['transaction'] as Map<String, dynamic>);
  }

  Future<Transaction> updateTransaction(
    int id, {
    required String type,
    required double amount,
    required String category,
    required String date,
    String? description,
  }) async {
    final response = await _dio.put('/transactions/$id', data: {
      'type': type,
      'amount': amount,
      'category': category,
      'date': date,
      if (description != null) 'description': description,
    });
    return Transaction.fromJson(response.data['transaction'] as Map<String, dynamic>);
  }

  Future<void> deleteTransaction(int id) async {
    await _dio.delete('/transactions/$id');
  }

  Future<List<CategorySummary>> getSummaryByCategory({
    String? from,
    String? to,
  }) async {
    final response = await _dio.get(
      '/transactions/summary/by-category',
      queryParameters: {
        if (from != null) 'from': from,
        if (to != null) 'to': to,
      },
    );
    return (response.data['data'] as List)
        .map((e) => CategorySummary.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
