import { UserPreferences } from '@anc/shared';
import { UserRepository } from '../repositories/userRepository';

export class PersonalizationService {
  private readonly userRepository: UserRepository;

  constructor(userRepository?: UserRepository) {
    this.userRepository = userRepository ?? new UserRepository();
  }

  getPreferences(userId: string) {
    return this.userRepository.getPreferences(userId);
  }

  updatePreferences(payload: UserPreferences) {
    return this.userRepository.savePreferences(payload);
  }
}
