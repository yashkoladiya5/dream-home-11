import 'package:flutter/material.dart';

class FilterSeriesScreen extends StatefulWidget {
  const FilterSeriesScreen({Key? key}) : super(key: key);

  @override
  State<FilterSeriesScreen> createState() => _FilterSeriesScreenState();
}

class _FilterSeriesScreenState extends State<FilterSeriesScreen> {
  // Filter states
  RangeValues _prizeRange = const RangeValues(0, 1000000);
  RangeValues _entryFeeRange = const RangeValues(0, 10000);
  
  final List<String> _contestTypes = ['All', 'Mega', 'Normal', 'Home', 'Private'];
  String _selectedContestType = 'All';

  final List<String> _contestStatuses = ['All', 'Upcoming', 'Live', 'Completed'];
  String _selectedContestStatus = 'All';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Filter Contests'),
        actions: [
          TextButton(
            onPressed: () {
              // Reset filters
              setState(() {
                _prizeRange = const RangeValues(0, 1000000);
                _entryFeeRange = const RangeValues(0, 10000);
                _selectedContestType = 'All';
                _selectedContestStatus = 'All';
              });
            },
            child: const Text('RESET', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Contest Type',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: _contestTypes.map((type) {
                return ChoiceChip(
                  label: Text(type),
                  selected: _selectedContestType == type,
                  onSelected: (selected) {
                    if (selected) {
                      setState(() {
                        _selectedContestType = type;
                      });
                    }
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 24),

            const Text(
              'Status',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: _contestStatuses.map((status) {
                return ChoiceChip(
                  label: Text(status),
                  selected: _selectedContestStatus == status,
                  onSelected: (selected) {
                    if (selected) {
                      setState(() {
                        _selectedContestStatus = status;
                      });
                    }
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 24),

            Text(
              'Entry Fee (₹${_entryFeeRange.start.round()} - ₹${_entryFeeRange.end.round()})',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            RangeSlider(
              values: _entryFeeRange,
              min: 0,
              max: 10000,
              divisions: 100,
              labels: RangeLabels(
                '₹${_entryFeeRange.start.round()}',
                '₹${_entryFeeRange.end.round()}',
              ),
              onChanged: (values) {
                setState(() {
                  _entryFeeRange = values;
                });
              },
            ),
            const SizedBox(height: 24),

            Text(
              'Total Prize Pool (₹${_prizeRange.start.round()} - ₹${_prizeRange.end.round()})',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            RangeSlider(
              values: _prizeRange,
              min: 0,
              max: 1000000,
              divisions: 100,
              labels: RangeLabels(
                '₹${_prizeRange.start.round()}',
                '₹${_prizeRange.end.round()}',
              ),
              onChanged: (values) {
                setState(() {
                  _prizeRange = values;
                });
              },
            ),
            const SizedBox(height: 40),

            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () {
                  // Apply filters and return to previous screen
                  Navigator.pop(context, {
                    'type': _selectedContestType,
                    'status': _selectedContestStatus,
                    'entryFeeRange': _entryFeeRange,
                    'prizeRange': _prizeRange,
                  });
                },
                child: const Text('APPLY FILTERS'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
