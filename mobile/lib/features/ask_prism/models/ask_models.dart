class CitationModel {
  final String chunkId;
  final String? documentId;
  final String? policyId;
  final int? pageNumber;
  final String? sectionTitle;

  const CitationModel({
    required this.chunkId,
    this.documentId,
    this.policyId,
    this.pageNumber,
    this.sectionTitle,
  });

  factory CitationModel.fromJson(Map<String, dynamic> json) {
    return CitationModel(
      chunkId: json['chunk_id'] as String? ?? json['id'] as String? ?? '',
      documentId: json['document_id'] as String?,
      policyId: json['policy_id'] as String?,
      pageNumber: (json['page_number'] as num?)?.toInt(),
      sectionTitle: json['section_title'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'chunk_id': chunkId,
      'document_id': documentId,
      'policy_id': policyId,
      'page_number': pageNumber,
      'section_title': sectionTitle,
    };
  }
}

class SourceModel {
  final String chunkId;
  final String? documentId;
  final String? policyId;
  final int? pageNumber;
  final String? sectionTitle;
  final String? content;
  final double? similarity;

  const SourceModel({
    required this.chunkId,
    this.documentId,
    this.policyId,
    this.pageNumber,
    this.sectionTitle,
    this.content,
    this.similarity,
  });

  factory SourceModel.fromJson(Map<String, dynamic> json) {
    return SourceModel(
      chunkId: json['chunk_id'] as String? ?? json['id'] as String? ?? '',
      documentId: json['document_id'] as String?,
      policyId: json['policy_id'] as String?,
      pageNumber: (json['page_number'] as num?)?.toInt(),
      sectionTitle: json['section_title'] as String?,
      content: json['content'] as String?,
      similarity: (json['similarity'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'chunk_id': chunkId,
      'document_id': documentId,
      'policy_id': policyId,
      'page_number': pageNumber,
      'section_title': sectionTitle,
      'content': content,
      'similarity': similarity,
    };
  }
}

class AskResponseModel {
  final String answer;
  final bool grounded;
  final String confidence; // "high" | "medium" | "low"
  final String conversationId;
  final String messageId;
  final List<CitationModel> citations;
  final List<SourceModel> sources;

  const AskResponseModel({
    required this.answer,
    required this.grounded,
    required this.confidence,
    required this.conversationId,
    required this.messageId,
    required this.citations,
    required this.sources,
  });

  factory AskResponseModel.fromJson(Map<String, dynamic> json) {
    return AskResponseModel(
      answer: json['answer'] as String? ?? '',
      grounded: json['grounded'] as bool? ?? false,
      confidence: json['confidence'] as String? ?? 'low',
      conversationId: json['conversation_id'] as String? ?? '',
      messageId: json['message_id'] as String? ?? '',
      citations: (json['citations'] as List<dynamic>?)
              ?.map((e) => CitationModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      sources: (json['sources'] as List<dynamic>?)
              ?.map((e) => SourceModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'answer': answer,
      'grounded': grounded,
      'confidence': confidence,
      'conversation_id': conversationId,
      'message_id': messageId,
      'citations': citations.map((e) => e.toJson()).toList(),
      'sources': sources.map((e) => e.toJson()).toList(),
    };
  }
}

class ChatMessageModel {
  final String id;
  final String role; // "user" | "assistant"
  final String content;
  final bool? grounded;
  final String? confidence;
  final List<CitationModel> citations;
  final List<SourceModel> sources;
  final DateTime createdAt;

  const ChatMessageModel({
    required this.id,
    required this.role,
    required this.content,
    this.grounded,
    this.confidence,
    this.citations = const [],
    this.sources = const [],
    required this.createdAt,
  });

  bool get isUser => role == 'user';
  bool get isAssistant => role == 'assistant';

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    final rawCitations = json['citations'] as List<dynamic>?;
    final citations = rawCitations
            ?.map((e) => CitationModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        const [];

    final rawSources = json['sources'] as List<dynamic>?;
    final sources = rawSources
            ?.map((e) => SourceModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        const [];

    final rawDate = json['created_at'] as String?;
    final createdAt = rawDate != null
        ? DateTime.tryParse(rawDate) ?? DateTime.now()
        : DateTime.now();

    return ChatMessageModel(
      id: json['id'] as String? ?? '',
      role: json['role'] as String? ?? 'user',
      content: json['content'] as String? ?? '',
      grounded: json['grounded'] as bool?,
      confidence: json['confidence'] as String?,
      citations: citations,
      sources: sources,
      createdAt: createdAt,
    );
  }
}
