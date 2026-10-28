import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../data/models.dart';
import '../../state/app_state.dart';
import '../../widgets/widgets.dart';

/// Pick a study partner to message. Only accepted partners can be messaged.
class NewMessageScreen extends StatelessWidget {
  const NewMessageScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    const header = TopBar(title: 'New message', close: true, fallback: '/messages');
    return Loader<List<Person>>(
      load: app.api.connections,
      frame: (context, body) => Screen(header: header, body: body),
      builder: (context, partners, reload) => Screen(
        header: header,
        onRefresh: reload,
        children: [
          if (partners.isEmpty)
            const EmptyCard(
              title: 'No study partners yet',
              detail: 'You can message people once they accept your partner request.',
              action: ZButton(label: 'Find partners', variant: ButtonVariant.match, size: ButtonSize.sm, href: '/partners'),
            )
          else ...[
            const SectionLabel('Your study partners'),
            Surface(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: separated([
                  for (final p in partners)
                    InkWell(
                      onTap: () => context.pushReplacement('/dm/${p.id}'),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          spacing: 12,
                          children: [
                            Avatar.of(p),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  ZText(p.name, variant: TextVariant.h3),
                                  if (p.academicLine.isNotEmpty) ZText(p.academicLine, variant: TextVariant.small, muted: true, maxLines: 1),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ]),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
