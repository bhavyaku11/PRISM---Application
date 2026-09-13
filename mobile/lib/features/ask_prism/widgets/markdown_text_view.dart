import 'package:flutter/material.dart';

/// Lightweight, safe Markdown renderer for PRISM AI policy answers.
/// Handles headers, bullet points, numbered lists, and bold/italic inline text
/// without arbitrary HTML or webview vulnerabilities.
class MarkdownTextView extends StatelessWidget {
  final String text;
  final TextStyle? baseStyle;

  const MarkdownTextView({
    super.key,
    required this.text,
    this.baseStyle,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final defaultStyle = baseStyle ??
        theme.textTheme.bodyMedium?.copyWith(
          fontSize: 13.5,
          height: 1.5,
          color: theme.brightness == Brightness.dark
              ? const Color(0xFFE2E8F0)
              : const Color(0xFF1E293B),
        ) ??
        const TextStyle(fontSize: 13.5, height: 1.5);

    final lines = text.split('\n');
    final widgets = <Widget>[];

    for (int i = 0; i < lines.length; i++) {
      final line = lines[i];
      final trimmed = line.trim();

      if (trimmed.isEmpty) {
        widgets.add(const SizedBox(height: 6));
        continue;
      }

      // 1. Heading 3: ### Heading
      if (trimmed.startsWith('### ')) {
        widgets.add(Padding(
          padding: const EdgeInsets.only(top: 8, bottom: 4),
          child: Text(
            trimmed.substring(4),
            style: defaultStyle.copyWith(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              letterSpacing: -0.2,
            ),
          ),
        ));
      }
      // 2. Heading 2: ## Heading
      else if (trimmed.startsWith('## ')) {
        widgets.add(Padding(
          padding: const EdgeInsets.only(top: 10, bottom: 4),
          child: Text(
            trimmed.substring(3),
            style: defaultStyle.copyWith(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              letterSpacing: -0.3,
            ),
          ),
        ));
      }
      // 3. Heading 1: # Heading
      else if (trimmed.startsWith('# ')) {
        widgets.add(Padding(
          padding: const EdgeInsets.only(top: 12, bottom: 6),
          child: Text(
            trimmed.substring(2),
            style: defaultStyle.copyWith(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              letterSpacing: -0.4,
            ),
          ),
        ));
      }
      // 4. Bullet lists: - item or * item or • item
      else if (trimmed.startsWith('- ') ||
          trimmed.startsWith('* ') ||
          trimmed.startsWith('• ')) {
        final content = trimmed.substring(2);
        widgets.add(Padding(
          padding: const EdgeInsets.symmetric(vertical: 2),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(' • ',
                  style: defaultStyle.copyWith(
                      fontWeight: FontWeight.bold, fontSize: 14)),
              Expanded(
                child: _buildInlineFormattedText(content, defaultStyle),
              ),
            ],
          ),
        ));
      }
      // 5. Numbered list: e.g. 1. item, 2. item
      else if (RegExp(r'^\d+\.\s').hasMatch(trimmed)) {
        final match = RegExp(r'^(\d+\.)\s').firstMatch(trimmed)!;
        final prefix = match.group(1)!;
        final content = trimmed.substring(match.end);
        widgets.add(Padding(
          padding: const EdgeInsets.symmetric(vertical: 2),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 22,
                child: Text(
                  prefix,
                  style: defaultStyle.copyWith(
                    fontWeight: FontWeight.w600,
                    color: defaultStyle.color?.withValues(alpha: 0.8),
                  ),
                ),
              ),
              Expanded(
                child: _buildInlineFormattedText(content, defaultStyle),
              ),
            ],
          ),
        ));
      }
      // 6. Regular paragraph
      else {
        widgets.add(Padding(
          padding: const EdgeInsets.symmetric(vertical: 2),
          child: _buildInlineFormattedText(trimmed, defaultStyle),
        ));
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: widgets,
    );
  }

  /// Parses inline bold (**text**) and italic (*text*) spans.
  Widget _buildInlineFormattedText(String text, TextStyle baseStyle) {
    if (!text.contains('*') && !text.contains('_')) {
      return Text(text, style: baseStyle);
    }

    final spans = <TextSpan>[];
    final regex = RegExp(r'(\*\*[^*]+\*\*|\*[^*]+\*)');

    int lastIndex = 0;
    for (final match in regex.allMatches(text)) {
      if (match.start > lastIndex) {
        spans.add(TextSpan(
          text: text.substring(lastIndex, match.start),
          style: baseStyle,
        ));
      }

      final matchedText = match.group(0)!;
      if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
        spans.add(TextSpan(
          text: matchedText.substring(2, matchedText.length - 2),
          style: baseStyle.copyWith(fontWeight: FontWeight.bold),
        ));
      } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
        spans.add(TextSpan(
          text: matchedText.substring(1, matchedText.length - 1),
          style: baseStyle.copyWith(fontStyle: FontStyle.italic),
        ));
      }

      lastIndex = match.end;
    }

    if (lastIndex < text.length) {
      spans.add(TextSpan(
        text: text.substring(lastIndex),
        style: baseStyle,
      ));
    }

    return RichText(
      text: TextSpan(children: spans),
    );
  }
}
