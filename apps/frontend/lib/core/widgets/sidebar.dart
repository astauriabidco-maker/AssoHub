import 'package:flutter/material.dart';
import 'package:frontend/core/theme/app_colors.dart';
import 'package:frontend/core/theme/app_text_styles.dart';

class SidebarItem {
  final IconData icon;
  final String label;
  final int index;

  const SidebarItem({
    required this.icon,
    required this.label,
    required this.index,
  });
}

class AppSidebar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onItemTap;
  final VoidCallback onLogout;
  final List<SidebarItem> items;

  const AppSidebar({
    super.key,
    required this.currentIndex,
    required this.onItemTap,
    required this.onLogout,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 260,
      decoration: const BoxDecoration(
        gradient: AppColors.sidebarGradient,
      ),
      child: Column(
        children: [
          // ── Brand Header ──
          Container(
            padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.hub, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 12),
                Text('ASSOSHUB', style: AppTextStyles.sidebarBrand),
              ],
            ),
          ),

          const SizedBox(height: 8),

          // ── Menu Items ──
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Column(
                children: [
                  ...items.map((item) => _SidebarTile(
                        icon: item.icon,
                        label: item.label,
                        isActive: currentIndex == item.index,
                        onTap: () => onItemTap(item.index),
                      )),
                ],
              ),
            ),
          ),

          // ── Logout ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: _SidebarTile(
              icon: Icons.logout_rounded,
              label: 'Déconnexion',
              isActive: false,
              onTap: onLogout,
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _SidebarTile extends StatefulWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _SidebarTile({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  State<_SidebarTile> createState() => _SidebarTileState();
}

class _SidebarTileState extends State<_SidebarTile> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: MouseRegion(
        onEnter: (_) => setState(() => _isHovered = true),
        onExit: (_) => setState(() => _isHovered = false),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeInOut,
          decoration: BoxDecoration(
            color: widget.isActive
                ? AppColors.primary.withOpacity(0.15)
                : _isHovered
                    ? AppColors.sidebarHover
                    : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: widget.onTap,
              borderRadius: BorderRadius.circular(10),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                child: Row(
                  children: [
                    // Active indicator bar
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 3,
                      height: 20,
                      decoration: BoxDecoration(
                        color: widget.isActive
                            ? AppColors.primary
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Icon(
                      widget.icon,
                      size: 20,
                      color: widget.isActive
                          ? AppColors.primaryLight
                          : AppColors.sidebarText,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      widget.label,
                      style: widget.isActive
                          ? AppTextStyles.sidebarItemActive
                          : AppTextStyles.sidebarItem,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
