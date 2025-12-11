import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { Loader2 } from 'lucide-react';

interface NotificationPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationPreferencesDialog = ({
  open,
  onOpenChange,
}: NotificationPreferencesDialogProps) => {
  const { preferences, updatePreferences } = useNotifications();
  const [localPrefs, setLocalPrefs] = useState({
    help_articles: true,
    feature_updates: true,
    tips: true,
    system_notifications: true,
    email_notifications: false,
  });

  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        help_articles: preferences.help_articles,
        feature_updates: preferences.feature_updates,
        tips: preferences.tips,
        system_notifications: preferences.system_notifications,
        email_notifications: preferences.email_notifications,
      });
    }
  }, [preferences]);

  const handleSave = () => {
    updatePreferences(localPrefs);
    onOpenChange(false);
  };

  if (!preferences) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notification Preferences</DialogTitle>
          <DialogDescription>
            Choose which types of notifications you'd like to receive.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">In-App Notifications</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="help_articles" className="flex flex-col gap-1 cursor-pointer">
                <span className="text-sm font-medium">Help Articles</span>
                <span className="text-xs text-muted-foreground">
                  New documentation and guides
                </span>
              </Label>
              <Switch
                id="help_articles"
                checked={localPrefs.help_articles}
                onCheckedChange={(checked) =>
                  setLocalPrefs({ ...localPrefs, help_articles: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="feature_updates" className="flex flex-col gap-1 cursor-pointer">
                <span className="text-sm font-medium">Feature Updates</span>
                <span className="text-xs text-muted-foreground">
                  New features and improvements
                </span>
              </Label>
              <Switch
                id="feature_updates"
                checked={localPrefs.feature_updates}
                onCheckedChange={(checked) =>
                  setLocalPrefs({ ...localPrefs, feature_updates: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="tips" className="flex flex-col gap-1 cursor-pointer">
                <span className="text-sm font-medium">Tips & Suggestions</span>
                <span className="text-xs text-muted-foreground">
                  Personalized tips based on your usage
                </span>
              </Label>
              <Switch
                id="tips"
                checked={localPrefs.tips}
                onCheckedChange={(checked) =>
                  setLocalPrefs({ ...localPrefs, tips: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="system_notifications" className="flex flex-col gap-1 cursor-pointer">
                <span className="text-sm font-medium">System Notifications</span>
                <span className="text-xs text-muted-foreground">
                  Important system updates and maintenance
                </span>
              </Label>
              <Switch
                id="system_notifications"
                checked={localPrefs.system_notifications}
                onCheckedChange={(checked) =>
                  setLocalPrefs({ ...localPrefs, system_notifications: checked })
                }
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-foreground">Email Notifications</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="email_notifications" className="flex flex-col gap-1 cursor-pointer">
                <span className="text-sm font-medium">Email Digest</span>
                <span className="text-xs text-muted-foreground">
                  Weekly summary of updates and tips
                </span>
              </Label>
              <Switch
                id="email_notifications"
                checked={localPrefs.email_notifications}
                onCheckedChange={(checked) =>
                  setLocalPrefs({ ...localPrefs, email_notifications: checked })
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Preferences</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
