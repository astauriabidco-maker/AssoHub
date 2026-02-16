import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:frontend/features/auth/auth_provider.dart';
import 'package:frontend/features/members/screens/members_list_screen.dart';
import 'package:frontend/core/theme/app_colors.dart';
import 'package:frontend/core/theme/app_text_styles.dart';
import 'package:frontend/core/widgets/sidebar.dart';

class DashboardScreen extends StatefulWidget {
  final int initialIndex;
  const DashboardScreen({super.key, this.initialIndex = 0});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late int _currentIndex;
  final GlobalKey<MembersListScreenState> _membersListKey =
      GlobalKey<MembersListScreenState>();

  static const _menuItems = [
    SidebarItem(icon: Icons.dashboard_rounded, label: 'Dashboard', index: 0),
    SidebarItem(icon: Icons.people_rounded, label: 'Membres', index: 1),
    SidebarItem(
        icon: Icons.account_balance_wallet_rounded,
        label: 'Finances',
        index: 2),
    SidebarItem(icon: Icons.event_rounded, label: 'Événements', index: 3),
    SidebarItem(icon: Icons.settings_rounded, label: 'Paramètres', index: 4),
  ];

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Row(
        children: [
          // ── Sidebar ──
          AppSidebar(
            currentIndex: _currentIndex,
            onItemTap: (i) => setState(() => _currentIndex = i),
            onLogout: () {
              context.read<AuthProvider>().logout();
              context.go('/login');
            },
            items: _menuItems,
          ),

          // ── Main Content ──
          Expanded(
            child: Column(
              children: [
                // ── Top Header Bar ──
                Container(
                  height: 72,
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    border: Border(
                      bottom: BorderSide(
                          color: AppColors.border.withOpacity(0.5), width: 1),
                    ),
                  ),
                  child: Row(
                    children: [
                      Text(
                        _getPageTitle(),
                        style: AppTextStyles.heading3,
                      ),
                      const Spacer(),
                      // Notification bell
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(Icons.notifications_outlined),
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 8),
                      // User avatar
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.person, color: Colors.white, size: 18),
                      ),
                    ],
                  ),
                ),

                // ── Page Content ──
                Expanded(
                  child: IndexedStack(
                    index: _currentIndex,
                    children: [
                      _DashboardOverview(),
                      MembersListScreen(key: _membersListKey),
                      _ComingSoonPage(title: 'Finances', icon: Icons.account_balance_wallet_rounded),
                      _ComingSoonPage(title: 'Événements', icon: Icons.event_rounded),
                      _ComingSoonPage(title: 'Paramètres', icon: Icons.settings_rounded),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: _currentIndex == 1
          ? FloatingActionButton.extended(
              onPressed: () {
                _membersListKey.currentState?.showAddMemberDialog(context);
              },
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add),
              label: const Text('Ajouter'),
            )
          : null,
    );
  }

  String _getPageTitle() {
    switch (_currentIndex) {
      case 0:
        return 'Dashboard';
      case 1:
        return 'Membres';
      case 2:
        return 'Finances';
      case 3:
        return 'Événements';
      case 4:
        return 'Paramètres';
      default:
        return '';
    }
  }
}

// ── Dashboard Overview ──
class _DashboardOverview extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Bienvenue sur votre espace 👋',
            style: AppTextStyles.heading2,
          ),
          const SizedBox(height: 4),
          Text(
            'Voici un aperçu de votre association.',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 32),

          // ── Stat Cards ──
          LayoutBuilder(
            builder: (context, constraints) {
              final crossCount = constraints.maxWidth > 900 ? 4 : 2;
              return GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: crossCount,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 2.2,
                children: const [
                  _StatCard(
                    title: 'Membres',
                    value: '—',
                    icon: Icons.people_rounded,
                    color: AppColors.primary,
                    bgColor: Color(0xFFEEF2FF),
                  ),
                  _StatCard(
                    title: 'Cotisations',
                    value: '—',
                    icon: Icons.receipt_long_rounded,
                    color: AppColors.success,
                    bgColor: AppColors.successLight,
                  ),
                  _StatCard(
                    title: 'En retard',
                    value: '—',
                    icon: Icons.warning_amber_rounded,
                    color: AppColors.warning,
                    bgColor: AppColors.warningLight,
                  ),
                  _StatCard(
                    title: 'Solde',
                    value: '—',
                    icon: Icons.account_balance_rounded,
                    color: AppColors.info,
                    bgColor: AppColors.infoLight,
                  ),
                ],
              );
            },
          ),

          const SizedBox(height: 32),

          // ── Recent Activity ──
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Activité récente', style: AppTextStyles.heading4),
                const SizedBox(height: 16),
                Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 32),
                    child: Column(
                      children: [
                        Icon(Icons.history_rounded,
                            size: 48, color: AppColors.textMuted),
                        const SizedBox(height: 12),
                        Text(
                          'Aucune activité récente',
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Stat Card ──
class _StatCard extends StatefulWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final Color bgColor;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    required this.bgColor,
  });

  @override
  State<_StatCard> createState() => _StatCardState();
}

class _StatCardState extends State<_StatCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: _isHovered ? widget.color.withOpacity(0.3) : AppColors.border,
          ),
          boxShadow: _isHovered
              ? [
                  BoxShadow(
                    color: widget.color.withOpacity(0.08),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [],
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: widget.bgColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(widget.icon, color: widget.color, size: 24),
            ),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  widget.title,
                  style: AppTextStyles.labelSmall,
                ),
                const SizedBox(height: 4),
                Text(
                  widget.value,
                  style: AppTextStyles.heading3.copyWith(color: widget.color),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Coming Soon Page ──
class _ComingSoonPage extends StatelessWidget {
  final String title;
  final IconData icon;

  const _ComingSoonPage({required this.title, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(icon, size: 40, color: AppColors.primary),
          ),
          const SizedBox(height: 24),
          Text(title, style: AppTextStyles.heading2),
          const SizedBox(height: 8),
          Text(
            'Cette section sera bientôt disponible',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
