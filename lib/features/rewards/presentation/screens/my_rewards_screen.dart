import 'package:flutter/material.dart';

class MyRewardsScreen extends StatelessWidget {
  const MyRewardsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Placeholder data
    final List<Map<String, dynamic>> rewards = [
      {
        'id': '1',
        'title': 'Amazon Gift Card \$50',
        'status': 'Delivered',
        'date': '2026-07-01',
        'image': 'https://via.placeholder.com/150',
      },
      {
        'id': '2',
        'title': 'PlayStation 5',
        'status': 'Processing',
        'date': '2026-07-15',
        'image': 'https://via.placeholder.com/150',
      },
      {
        'id': '3',
        'title': 'Dream11 T-Shirt',
        'status': 'Shipped',
        'date': '2026-07-18',
        'image': 'https://via.placeholder.com/150',
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Rewards'),
      ),
      body: rewards.isEmpty
          ? const Center(
              child: Text(
                'You have not redeemed any rewards yet.',
                style: TextStyle(fontSize: 16),
              ),
            )
          : ListView.builder(
              itemCount: rewards.length,
              itemBuilder: (context, index) {
                final reward = rewards[index];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(12),
                    leading: Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        image: DecorationImage(
                          image: NetworkImage(reward['image']),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    title: Text(
                      reward['title'],
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 4),
                        Text('Redeemed on: ${reward['date']}'),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              _getStatusIcon(reward['status']),
                              size: 16,
                              color: _getStatusColor(reward['status']),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              reward['status'],
                              style: TextStyle(
                                color: _getStatusColor(reward['status']),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      // Navigate to reward details/tracking
                    },
                  ),
                );
              },
            ),
    );
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'delivered':
        return Icons.check_circle;
      case 'shipped':
        return Icons.local_shipping;
      case 'processing':
        return Icons.hourglass_empty;
      default:
        return Icons.info;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'delivered':
        return Colors.green;
      case 'shipped':
        return Colors.blue;
      case 'processing':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }
}
