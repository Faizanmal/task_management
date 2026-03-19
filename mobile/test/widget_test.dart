import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:mobile/main.dart';

void main() {
  testWidgets('App boots and shows auth screen', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(const EarnestTaskApp());
    await tester.pumpAndSettle();

    expect(find.text('Earnest Task Manager'), findsOneWidget);
  });
}
